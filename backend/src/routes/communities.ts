import express from 'express';
import { body, validationResult } from 'express-validator';

import { Community } from '@/models/Community';
import { Post } from '@/models/Post';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

// Validation middleware
const validateCommunity = [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('category').trim().isLength({ min: 1 }),
  body('isPrivate').optional().isBoolean(),
];

const validatePost = [
  body('content').trim().isLength({ min: 1, max: 5000 }),
  body('type').isIn(['text', 'link', 'image', 'poll']),
];

// @route   GET /api/communities
// @desc    Get all communities
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const communities = await Community.find(query)
      .populate('creator', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Community.countDocuments(query);

    res.json({
      communities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get communities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities
// @desc    Create a new community
// @access  Private
router.post('/', authMiddleware, validateCommunity, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, isPrivate = false, rules } = req.body;

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ message: 'Community name already exists' });
    }

    const community = new Community({
      name,
      description,
      category,
      isPrivate,
      rules: rules || [],
      creator: req.user.userId,
      members: [req.user.userId],
      moderators: [req.user.userId],
    });

    await community.save();

    // Populate creator and members
    await community.populate('creator', 'firstName lastName email');
    await community.populate('members', 'firstName lastName email');

    res.status(201).json({ community });
  } catch (error) {
    logger.error('Create community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:id
// @desc    Get community by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('moderators', 'firstName lastName email');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is a member (for private communities)
    if (community.isPrivate && !community.members.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ community });
  } catch (error) {
    logger.error('Get community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/communities/:id
// @desc    Update community
// @access  Private (Creator/Moderator only)
router.put('/:id', authMiddleware, validateCommunity, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is creator or moderator
    if (!community.creator.equals(req.user.userId) && 
        !community.moderators.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, category, isPrivate, rules } = req.body;

    // Check if new name conflicts with existing community
    if (name && name !== community.name) {
      const existingCommunity = await Community.findOne({ name });
      if (existingCommunity) {
        return res.status(400).json({ message: 'Community name already exists' });
      }
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.id,
      { name, description, category, isPrivate, rules },
      { new: true, runValidators: true }
    )
      .populate('creator', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    res.json({ community: updatedCommunity });
  } catch (error) {
    logger.error('Update community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:id/join
// @desc    Join a community
// @access  Private
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is already a member
    if (community.members.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already a member of this community' });
    }

    // Add user to members
    community.members.push(req.user.userId);
    await community.save();

    res.json({ message: 'Joined community successfully' });
  } catch (error) {
    logger.error('Join community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:id/leave
// @desc    Leave a community
// @access  Private
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is a member
    if (!community.members.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Not a member of this community' });
    }

    // Remove user from members
    community.members = community.members.filter(
      memberId => !memberId.equals(req.user.userId)
    );

    // Remove from moderators if applicable
    community.moderators = community.moderators.filter(
      moderatorId => !moderatorId.equals(req.user.userId)
    );

    await community.save();

    res.json({ message: 'Left community successfully' });
  } catch (error) {
    logger.error('Leave community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:id/posts
// @desc    Get community posts
// @access  Private
router.get('/:id/posts', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is a member (for private communities)
    if (community.isPrivate && !community.members.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await Post.find({ community: req.params.id })
      .populate('author', 'firstName lastName email')
      .populate('community', 'name')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments({ community: req.params.id });

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get community posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:id/posts
// @desc    Create a post in community
// @access  Private
router.post('/:id/posts', authMiddleware, validatePost, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is a member
    if (!community.members.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Must be a member to post' });
    }

    const { content, type, title, link, imageUrl, pollOptions } = req.body;

    const post = new Post({
      content,
      type,
      title,
      link,
      imageUrl,
      pollOptions,
      author: req.user.userId,
      community: req.params.id,
    });

    await post.save();

    // Populate author and community
    await post.populate('author', 'firstName lastName email');
    await post.populate('community', 'name');

    res.status(201).json({ post });
  } catch (error) {
    logger.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 