import express from 'express';
import Stripe from 'stripe';

import { User } from '@/models/User';
import { Event } from '@/models/Event';
import { logger } from '@/utils/logger';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// @route   POST /api/webhooks/stripe
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret!);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { userId, type, eventId } = paymentIntent.metadata;

  if (type === 'event_ticket' && eventId) {
    // Handle event ticket purchase
    const event = await Event.findById(eventId);
    if (event && !event.attendees.includes(userId)) {
      event.attendees.push(userId);
      await event.save();
      logger.info(`User ${userId} successfully purchased ticket for event ${eventId}`);
    }
  }

  logger.info(`Payment intent ${paymentIntent.id} succeeded for user ${userId}`);
}

// Handle failed payment intent
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { userId, type, eventId } = paymentIntent.metadata;

  logger.error(`Payment intent ${paymentIntent.id} failed for user ${userId}`);

  if (type === 'event_ticket' && eventId) {
    // Could implement retry logic or notify user
    logger.info(`Event ticket purchase failed for user ${userId}, event ${eventId}`);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (user) {
    user.subscription = {
      status: subscription.status,
      plan: 'premium',
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
    await user.save();
    logger.info(`Subscription created for user ${user._id}`);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (user) {
    user.subscription = {
      status: subscription.status,
      plan: 'premium',
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
    await user.save();
    logger.info(`Subscription updated for user ${user._id}`);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (user) {
    user.subscription = {
      status: 'canceled',
      plan: 'free',
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
    await user.save();
    logger.info(`Subscription canceled for user ${user._id}`);
  }
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (user && user.subscription) {
    user.subscription.status = 'active';
    await user.save();
    logger.info(`Invoice payment succeeded for user ${user._id}`);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (user && user.subscription) {
    user.subscription.status = 'past_due';
    await user.save();
    logger.error(`Invoice payment failed for user ${user._id}`);
  }
}

// @route   POST /api/webhooks/blockchain
// @desc    Handle blockchain events
// @access  Public
router.post('/blockchain', async (req, res) => {
  try {
    const { event, data } = req.body;

    switch (event) {
      case 'identity_verified':
        await handleIdentityVerified(data);
        break;

      case 'token_transfer':
        await handleTokenTransfer(data);
        break;

      case 'community_created':
        await handleCommunityCreated(data);
        break;

      default:
        logger.info(`Unhandled blockchain event: ${event}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Blockchain webhook error:', error);
    res.status(500).json({ error: 'Blockchain webhook handler failed' });
  }
});

// Handle identity verification
async function handleIdentityVerified(data: any) {
  const { userAddress, verifiedBy } = data;
  
  const user = await User.findOne({ walletAddress: userAddress });
  if (user) {
    user.profile.isVerified = true;
    user.profile.verifiedBy = verifiedBy;
    await user.save();
    logger.info(`Identity verified for user ${user._id}`);
  }
}

// Handle token transfer
async function handleTokenTransfer(data: any) {
  const { from, to, amount, tokenType } = data;
  
  logger.info(`Token transfer: ${amount} ${tokenType} from ${from} to ${to}`);
  
  // Could implement token balance tracking or rewards system
}

// Handle community creation on blockchain
async function handleCommunityCreated(data: any) {
  const { communityId, creator, metadata } = data;
  
  logger.info(`Community ${communityId} created on blockchain by ${creator}`);
  
  // Could sync with database or trigger additional actions
}

// @route   POST /api/webhooks/ai
// @desc    Handle AI service events
// @access  Public
router.post('/ai', async (req, res) => {
  try {
    const { event, data } = req.body;

    switch (event) {
      case 'recommendation_generated':
        await handleRecommendationGenerated(data);
        break;

      case 'matching_completed':
        await handleMatchingCompleted(data);
        break;

      case 'content_analyzed':
        await handleContentAnalyzed(data);
        break;

      default:
        logger.info(`Unhandled AI event: ${event}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('AI webhook error:', error);
    res.status(500).json({ error: 'AI webhook handler failed' });
  }
});

// Handle recommendation generation
async function handleRecommendationGenerated(data: any) {
  const { userId, recommendations, type } = data;
  
  logger.info(`Generated ${recommendations.length} ${type} recommendations for user ${userId}`);
  
  // Could store recommendations in cache or database
}

// Handle matching completion
async function handleMatchingCompleted(data: any) {
  const { userId, matches, score } = data;
  
  logger.info(`Completed matching for user ${userId} with ${matches.length} matches (score: ${score})`);
  
  // Could trigger notifications or update user preferences
}

// Handle content analysis
async function handleContentAnalyzed(data: any) {
  const { contentId, analysis, sentiment, topics } = data;
  
  logger.info(`Content ${contentId} analyzed: sentiment=${sentiment}, topics=${topics.join(', ')}`);
  
  // Could update content metadata or trigger moderation
}

export default router; 