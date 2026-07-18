import express from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { createRazorpayOrder, verifyRazorpaySignature, getPaymentDetails, refundPayment } from '../utils/razorpay.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay order
 * @access  Private
 */
router.post('/create-order', auth, [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Invalid currency code'),
  body('receipt').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { amount, currency = 'INR', receipt } = req.body;

    // Generate receipt if not provided
    const orderReceipt = receipt || `order_${Date.now()}_${req.user.id}`;

    // Create Razorpay order
    const order = await createRazorpayOrder(
      amount,
      currency,
      orderReceipt,
      {
        userId: req.user.id,
        userEmail: req.user.email,
      }
    );

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment signature
 * @access  Private
 */
router.post('/verify', auth, [
  body('orderId').isString().withMessage('Order ID is required'),
  body('paymentId').isString().withMessage('Payment ID is required'),
  body('signature').isString().withMessage('Signature is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId, paymentId, signature } = req.body;

    // Verify signature
    const isValid = verifyRazorpaySignature(orderId, paymentId, signature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Fetch payment details
    const paymentDetails = await getPaymentDetails(paymentId);

    res.json({
      success: true,
      verified: true,
      payment: {
        id: paymentDetails.id,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: paymentDetails.status,
        method: paymentDetails.method,
        captured: paymentDetails.captured,
        createdAt: paymentDetails.created_at,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
});

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get payment details
 * @access  Private
 */
router.get('/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentDetails = await getPaymentDetails(paymentId);

    res.json({
      success: true,
      payment: {
        id: paymentDetails.id,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: paymentDetails.status,
        method: paymentDetails.method,
        email: paymentDetails.email,
        contact: paymentDetails.contact,
        captured: paymentDetails.captured,
        createdAt: paymentDetails.created_at,
        notes: paymentDetails.notes,
      },
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
  }
});

/**
 * @route   POST /api/payments/refund
 * @desc    Refund a payment
 * @access  Private
 */
router.post('/refund', auth, [
  body('paymentId').isString().withMessage('Payment ID is required'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { paymentId, amount } = req.body;

    // Process refund
    const refund = await refundPayment(paymentId, amount ? amount * 100 : null);

    res.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        createdAt: refund.created_at,
      },
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook events
 * @access  Public
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ success: false, message: 'Webhook signature or secret missing' });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body.toString());

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity);
        // Update order status, send confirmation email, etc.
        break;
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity);
        // Handle failed payment
        break;
      case 'refund.processed':
        console.log('Refund processed:', event.payload.refund.entity);
        // Handle refund
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, message: 'Failed to process webhook' });
  }
});

export default router;
