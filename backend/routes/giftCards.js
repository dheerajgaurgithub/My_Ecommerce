import express from 'express';
import GiftCard from '../models/GiftCard.js';

const router = express.Router();

// Get all gift cards
router.get('/', async (req, res) => {
  try {
    const giftCards = await GiftCard.find({ is_published: true });
    res.json({ success: true, giftCards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create gift card
router.post('/', async (req, res) => {
  try {
    const giftCard = new GiftCard(req.body);
    await giftCard.save();
    res.status(201).json({ success: true, giftCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
