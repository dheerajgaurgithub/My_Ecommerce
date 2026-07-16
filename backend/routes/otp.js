import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Store OTPs in memory (in production, use Redis)
const otpStore = new Map();

// Generate and send OTP
router.post('/send', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, { otp, expiresAt });

    // Check if email service is initialized
    if (!emailService.transporter) {
      console.error('Email service not initialized - cannot send OTP');
      return res.status(500).json({ success: false, message: 'Email service not configured. Please contact support.' });
    }

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp, 'User');

    if (emailSent) {
      res.json({
        success: true,
        message: 'OTP sent successfully',
        expiresAt
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP is valid, remove it
    otpStore.delete(email);

    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      verified: true 
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Resend OTP
router.post('/resend', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store new OTP
    otpStore.set(email, { otp, expiresAt });

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp, 'User');

    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'OTP resent successfully',
        expiresAt 
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to resend OTP' });
    }
  } catch (error) {
    console.error('OTP resend error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send OTP for password reset (only for existing users)
router.post('/forgot-password/send', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ success: false, message: 'No account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with prefix for password reset
    otpStore.set(`reset_${email}`, { otp, expiresAt });

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp, existingUser.name || 'User');

    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Password reset OTP sent successfully',
        expiresAt 
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Password reset OTP send error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP for password reset
router.post('/forgot-password/verify', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(`reset_${email}`);

    if (!storedData) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(`reset_${email}`);
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP is valid, keep it for password update
    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      verified: true 
    });
  } catch (error) {
    console.error('Password reset OTP verify error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear OTP after successful password reset
router.post('/forgot-password/clear', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    otpStore.delete(`reset_${email}`);
    res.json({ success: true, message: 'OTP cleared successfully' });
  } catch (error) {
    console.error('OTP clear error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
