import express from 'express';
import ComboPack from '../models/ComboPack.js';

const router = express.Router();

// Get all combo packs
router.get('/', async (req, res) => {
  try {
    const combos = await ComboPack.find({ is_published: true });
    res.json({ success: true, combos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single combo by slug
router.get('/:slug', async (req, res) => {
  try {
    const combo = await ComboPack.findOne({ slug: req.params.slug }).populate('product_ids');
    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combo not found' });
    }
    res.json({ success: true, combo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create combo pack
router.post('/', async (req, res) => {
  try {
    const combo = new ComboPack(req.body);
    await combo.save();
    res.status(201).json({ success: true, combo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
