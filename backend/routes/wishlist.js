import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's wishlist
router.get('/', auth, async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ user_id: req.user._id }).populate('product_id');
    const products = wishlistItems.map(item => item.product_id);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add to wishlist
router.post('/', auth, async (req, res) => {
  try {
    const { product_id } = req.body;

    const existing = await Wishlist.findOne({
      user_id: req.user._id,
      product_id
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    const wishlistItem = new Wishlist({
      user_id: req.user._id,
      product_id
    });
    await wishlistItem.save();

    const populatedItem = await Wishlist.findById(wishlistItem._id).populate('product_id');
    res.status(201).json({ success: true, item: populatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from wishlist
router.delete('/:product_id', auth, async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({
      user_id: req.user._id,
      product_id: req.params.product_id
    });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check if product is in wishlist
router.get('/check/:product_id', auth, async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      user_id: req.user._id,
      product_id: req.params.product_id
    });
    res.json({ success: true, wishlisted: !!item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
