import express from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';

import { User } from '@/models/User';
import { Event } from '@/models/Event';
import { logger } from '@/utils/logger';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Validation middleware
const validatePayment = [
  body('amount').isFloat({ min: 0.01 }),
  body('currency').isIn(['usd', 'eur', 'gbp']),
  body('description').trim().isLength({ min: 1 }),
];

// @route   POST /api/payments/create-payment-intent
// @desc    Create a payment intent for Stripe
// @access  Private
router.post('/create-payment-intent', authMiddleware, validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, currency = 'usd', description, metadata = {} } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      metadata: {
        userId: req.user.userId,
        userEmail: user.email,
        ...metadata,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/subscribe
// @desc    Subscribe to premium plan
// @access  Private
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { priceId, paymentMethodId } = req.body;

    if (!priceId || !paymentMethodId) {
      return res.status(400).json({ message: 'Price ID and payment method ID are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create or retrieve customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: req.user.userId,
        },
      });

      // Save customer ID to user
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user subscription status
    user.subscription = {
      status: subscription.status,
      plan: 'premium',
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };

    await user.save();

    res.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
    });
  } catch (error) {
    logger.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/cancel-subscription
// @desc    Cancel premium subscription
// @access  Private
router.post('/cancel-subscription', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.subscription?.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update user subscription status
    user.subscription.status = 'canceled';
    await user.save();

    res.json({ message: 'Subscription will be canceled at the end of the current period' });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/event-ticket
// @desc    Purchase event ticket
// @access  Private
router.post('/event-ticket', authMiddleware, async (req, res) => {
  try {
    const { eventId, paymentMethodId } = req.body;

    if (!eventId || !paymentMethodId) {
      return res.status(400).json({ message: 'Event ID and payment method ID are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.ticketPrice <= 0) {
      return res.status(400).json({ message: 'Event is free' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already registered
    if (event.attendees.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Create or retrieve customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: req.user.userId,
        },
      });

      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create payment intent for ticket
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(event.ticketPrice * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethodId,
      description: `Ticket for ${event.title}`,
      metadata: {
        userId: req.user.userId,
        eventId: eventId,
        type: 'event_ticket',
      },
      confirm: true,
      return_url: `${process.env.FRONTEND_URL}/events/${eventId}`,
    });

    if (paymentIntent.status === 'succeeded') {
      // Add user to event attendees
      event.attendees.push(req.user.userId);
      await event.save();

      res.json({
        success: true,
        message: 'Ticket purchased successfully',
        paymentIntentId: paymentIntent.id,
      });
    } else {
      res.json({
        success: false,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }
  } catch (error) {
    logger.error('Purchase event ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/subscription-status
// @desc    Get user's subscription status
// @access  Private
router.get('/subscription-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      subscription: user.subscription,
      isPremium: user.subscription?.status === 'active',
    });
  } catch (error) {
    logger.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/payment-methods
// @desc    Get user's payment methods
// @access  Private
router.get('/payment-methods', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    res.json({
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      })),
    });
  } catch (error) {
    logger.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 