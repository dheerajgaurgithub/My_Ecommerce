import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Newsletter subscription
router.post('/subscribe', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    // For now, just return success (in production, you'd save to database)
    // You could add a Newsletter model later
    console.log('Newsletter subscription:', email);

    res.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
