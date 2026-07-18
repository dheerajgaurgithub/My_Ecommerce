import express from 'express';
import { body, validationResult } from 'express-validator';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Contact form submission
router.post('/submit', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    // Send email notification
    const emailSubject = `Contact Form Submission: ${subject}`;
    const emailBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    await sendEmail({
      to: 'replybymahirandfriends@gmail.com',
      subject: emailSubject,
      html: emailBody
    });

    res.json({ 
      success: true, 
      message: 'Message sent successfully. We will get back to you within 24 hours.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
