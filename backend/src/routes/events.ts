import express from 'express';
import { body, validationResult } from 'express-validator';

import { Event } from '@/models/Event';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

// Validation middleware
const validateEvent = [
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('description').trim().isLength({ min: 10, max: 2000 }),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('location').trim().isLength({ min: 1 }),
  body('category').trim().isLength({ min: 1 }),
  body('maxAttendees').optional().isInt({ min: 1 }),
  body('ticketPrice').optional().isFloat({ min: 0 }),
];

// @route   GET /api/events
// @desc    Get all events
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, search, date, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (date) {
      const startOfDay = new Date(date as string);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      query.startDate = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .limit(Number(limit))
      .skip(skip)
      .sort({ startDate: 1 });

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', authMiddleware, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      maxAttendees,
      ticketPrice = 0,
      isVirtual = false,
      meetingLink,
      tags = [],
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({ message: 'Event start date must be in the future' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const event = new Event({
      title,
      description,
      startDate: start,
      endDate: end,
      location,
      category,
      maxAttendees,
      ticketPrice,
      isVirtual,
      meetingLink,
      tags,
      organizer: req.user.userId,
      attendees: [req.user.userId], // Organizer is automatically an attendee
    });

    await event.save();

    // Populate organizer and attendees
    await event.populate('organizer', 'firstName lastName email');
    await event.populate('attendees', 'firstName lastName email');

    res.status(201).json({ event });
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    logger.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Organizer only)
router.put('/:id', authMiddleware, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (!event.organizer.equals(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      maxAttendees,
      ticketPrice,
      isVirtual,
      meetingLink,
      tags,
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        startDate: start,
        endDate: end,
        location,
        category,
        maxAttendees,
        ticketPrice,
        isVirtual,
        meetingLink,
        tags,
      },
      { new: true, runValidators: true }
    )
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    res.json({ event: updatedEvent });
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Organizer only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (!event.organizer.equals(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/register
// @desc    Register for an event
// @access  Private
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is full
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check if user is already registered
    if (event.attendees.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check if event has started
    if (new Date() >= event.startDate) {
      return res.status(400).json({ message: 'Event has already started' });
    }

    // Add user to attendees
    event.attendees.push(req.user.userId);
    await event.save();

    res.json({ message: 'Registered for event successfully' });
  } catch (error) {
    logger.error('Register for event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/unregister
// @desc    Unregister from an event
// @access  Private
router.post('/:id/unregister', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is registered
    if (!event.attendees.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(
      attendeeId => !attendeeId.equals(req.user.userId)
    );
    await event.save();

    res.json({ message: 'Unregistered from event successfully' });
  } catch (error) {
    logger.error('Unregister from event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/my-events
// @desc    Get user's events (organized and attending)
// @access  Private
router.get('/my-events', authMiddleware, async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (type === 'organized') {
      query.organizer = req.user.userId;
    } else if (type === 'attending') {
      query.attendees = req.user.userId;
    } else {
      // Get both organized and attending events
      query.$or = [
        { organizer: req.user.userId },
        { attendees: req.user.userId },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .limit(Number(limit))
      .skip(skip)
      .sort({ startDate: 1 });

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get my events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 