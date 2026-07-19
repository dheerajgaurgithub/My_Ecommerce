import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in rupees (will be converted to paise internally)
 * @param {string} currency - Currency code (default: INR)
 * @param {string} receipt - Receipt ID for order tracking
 * @param {object} notes - Additional notes for the order
 * @returns {Promise<object>} Razorpay order object
 */
export const createRazorpayOrder = async (amount, currency = 'INR', receipt = '', notes = {}) => {
  try {
    const options = {
      amount: amount * 100, // Convert rupees to paise (1 INR = 100 paise)
      currency,
      receipt,
      notes,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} True if signature is valid
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} Payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw new Error('Failed to fetch payment details');
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in paise (optional, full refund if not provided)
 * @returns {Promise<object>} Refund details
 */
export const refundPayment = async (paymentId, amount = null) => {
  try {
    const options = {};
    if (amount) {
      options.amount = amount;
    }

    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};

export default razorpay;
