import express from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Generate 2FA secret
router.post('/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: 'Mahir & Friends',
      issuer: 'Mahir & Friends',
      length: 32
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify and enable 2FA
router.post('/verify', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: '2FA setup not initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Disable 2FA
router.post('/disable', auth, async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    // Verify 2FA token if enabled
    if (user.twoFactorEnabled) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token
      });

      if (!verified) {
        return res.status(400).json({ success: false, message: 'Invalid token' });
      }
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate backup codes
router.post('/backup-codes', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(speakeasy.generateSecret({ length: 20 }).base32);
    }

    user.backupCodes = backupCodes;
    await user.save();

    res.json({
      success: true,
      backupCodes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
