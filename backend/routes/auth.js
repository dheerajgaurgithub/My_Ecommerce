import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import Notification from '../models/Notification.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Register with OTP verification (OTP is required)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, otp } = req.body;

    if (!email || !password || !name || !otp) {
      return res.status(400).json({ success: false, message: 'All fields including OTP are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name, role: 'customer', emailVerified: true });
    await user.save();

    // Create welcome notification
    await Notification.create({
      user_id: user._id,
      title: 'Welcome to Mahir & Friends!',
      message: 'Thank you for joining. Enjoy premium shopping with us.',
      type: 'welcome'
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(email, name);

    const token = generateToken(user._id);
    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, email: user.email, name: user.name, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Verify OTP for password reset
    const otpResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/otp/forgot-password/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const otpData = await otpResponse.json();
    if (!otpData.success) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Clear the OTP after successful password reset
    await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/otp/forgot-password/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Login (Hardcoded credentials)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mahirandfriends.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cofounder.in2026';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Check if admin user exists, create if not
    let adminUser = await User.findOne({ email });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      adminUser = new User({ 
        email: ADMIN_EMAIL, 
        password: hashedPassword, 
        name: 'Mahir Admin', 
        role: 'admin' 
      });
      await adminUser.save();
    }

    const token = generateToken(adminUser._id);
    res.json({ 
      success: true, 
      token, 
      user: { id: adminUser._id, email: adminUser.email, name: adminUser.name, role: adminUser.role } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
