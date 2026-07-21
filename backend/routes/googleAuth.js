import express from 'express';
import { google } from 'googleapis';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import Notification from '../models/Notification.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// OAuth2 Client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback'
);

// Get Google OAuth URL
router.get('/url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ success: true, url });
});

// Handle Google OAuth callback
router.post('/callback', async (req, res) => {
  try {
    const { code, locationData } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Check if user exists
    let user = await User.findOne({ email: data.email });

    if (!user) {
      // Create new user without requiring location (will be added in onboarding)
      user = new User({
        email: data.email,
        name: data.name,
        googleId: data.id,
        picture: data.picture,
        role: 'customer',
        emailVerified: true
      });
      await user.save();

      // Create welcome notification
      await Notification.create({
        user_id: user._id,
        title: 'Welcome to Mahir & Friends!',
        message: 'Thank you for joining us via Google. Enjoy premium shopping with us.',
        type: 'welcome'
      });

      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.name);
    } else {
      // Update existing user with Google info if not already linked
      if (!user.googleId) {
        user.googleId = data.id;
        user.picture = data.picture;
        user.emailVerified = true;
        // Update location if provided
        if (locationData && locationData.latitude && locationData.longitude && locationData.google_maps_link) {
          user.location = locationData.google_maps_link;
          user.latitude = locationData.latitude;
          user.longitude = locationData.longitude;
        }
        await user.save();
      }
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        picture: user.picture,
        emailVerified: user.emailVerified,
        location: user.location
      },
      isNewUser: !user.googleId || user.googleId !== data.id
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
