import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check first order discount status
router.get('/first-order-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, hasUsedFirstOrderDiscount: user.hasUsedFirstOrderDiscount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, nickname, profilePicture, location, phone } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;
    
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
