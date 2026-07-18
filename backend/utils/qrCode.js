import QRCode from 'qrcode';
import { createRazorpayOrder } from './razorpay.js';

/**
 * Generate QR code for payment
 * @param {string} data - Data to encode in QR code (UPI link or payment URL)
 * @returns {Promise<string>} Base64 encoded QR code image
 */
export const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate UPI payment link for QR code
 * @param {string} upiId - Merchant UPI ID
 * @param {string} name - Merchant name
 * @param {number} amount - Amount in INR
 * @param {string} transactionId - Unique transaction ID
 * @returns {string} UPI payment link
 */
export const generateUPILink = (upiId, name, amount, transactionId) => {
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tr=${transactionId}&cu=INR`;
  return upiLink;
};

/**
 * Create Razorpay order and generate QR code for payment
 * @param {number} amount - Amount in INR
 * @param {string} feeType - Type of fee (joining, renewal, etc.)
 * @param {string} partnerId - Delivery partner ID
 * @returns {Promise<object>} Order details with QR code
 */
export const createFeePaymentOrder = async (amount, feeType, partnerId) => {
  try {
    const receipt = `${feeType}_${partnerId}_${Date.now()}`;
    const notes = {
      fee_type: feeType,
      partner_id: partnerId,
      purpose: `Delivery partner ${feeType} fee`
    };

    const order = await createRazorpayOrder(amount, 'INR', receipt, notes);

    // Generate QR code with Razorpay payment link
    const paymentLink = `https://rzp.io/i/${order.id}`; // Razorpay payment link
    const qrCode = await generateQRCode(paymentLink);

    return {
      orderId: order.id,
      amount: order.amount / 100, // Convert back to INR
      currency: order.currency,
      receipt: order.receipt,
      qrCode,
      paymentLink,
      notes
    };
  } catch (error) {
    console.error('Error creating fee payment order:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Generate QR code for UPI payment (alternative to Razorpay)
 * @param {number} amount - Amount in INR
 * @param {string} feeType - Type of fee
 * @param {string} partnerId - Delivery partner ID
 * @param {string} upiId - Merchant UPI ID (from environment)
 * @returns {Promise<object>} QR code details
 */
export const createUPIPaymentQR = async (amount, feeType, partnerId, upiId) => {
  try {
    const transactionId = `${feeType}_${partnerId}_${Date.now()}`;
    const merchantName = 'Mahir & Friends';
    
    const upiLink = generateUPILink(upiId, merchantName, amount, transactionId);
    const qrCode = await generateQRCode(upiLink);

    return {
      amount,
      feeType,
      transactionId,
      upiLink,
      qrCode,
      upiId,
      merchantName
    };
  } catch (error) {
    console.error('Error creating UPI payment QR:', error);
    throw new Error('Failed to create UPI payment QR');
  }
};

export default { generateQRCode, generateUPILink, createFeePaymentOrder, createUPIPaymentQR };
