import express from 'express';
import { body, validationResult } from 'express-validator';

import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('profile.bio').optional().trim(),
  body('profile.location').optional().trim(),
  body('profile.website').optional().isURL(),
  body('profile.skills').optional().isArray(),
  body('profile.interests').optional().isArray(),
];

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, validateProfileUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, profile } = req.body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (profile) updateData.profile = { ...profile };

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, skills, location, limit = 20, page = 1 } = req.query;

    const query: any = {};

    if (q) {
      query.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { 'profile.bio': { $regex: q, $options: 'i' } },
      ];
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query['profile.skills'] = { $in: skillsArray };
    }

    if (location) {
      query['profile.location'] = { $regex: location, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(query)
      .select('-password')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/connections
// @desc    Send connection request
// @access  Private
router.post('/connections', authMiddleware, async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user ID is required' });
    }

    if (targetUserId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Check if connection already exists
    const existingConnection = await User.findOne({
      _id: req.user.userId,
      'connections.userId': targetUserId,
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection already exists' });
    }

    // Add connection request
    await User.findByIdAndUpdate(req.user.userId, {
      $push: {
        connections: {
          userId: targetUserId,
          status: 'pending',
          createdAt: new Date(),
        },
      },
    });

    res.json({ message: 'Connection request sent successfully' });
  } catch (error) {
    logger.error('Send connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/connections/:connectionId
// @desc    Accept/reject connection request
// @access  Private
router.put('/connections/:connectionId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { connectionId } = req.params;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const connection = user.connections.id(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    connection.status = status;
    await user.save();

    res.json({ message: `Connection ${status} successfully` });
  } catch (error) {
    logger.error('Update connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/connections/:connectionId
// @desc    Remove connection
// @access  Private
router.delete('/connections/:connectionId', authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const connection = user.connections.id(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    connection.remove();
    await user.save();

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    logger.error('Remove connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 