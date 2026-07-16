import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.productId })
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, rating, title, body, photos } = req.body;

    const review = new Review({
      product_id,
      user_id: req.user._id,
      user_name: req.user.name,
      rating,
      title,
      body,
      photos,
      is_verified: true // Assume verified for now
    });

    await review.save();

    // Update product rating
    const product = await Product.findById(product_id);
    if (product) {
      const allReviews = await Review.find({ product_id });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      product.rating = Math.round(avgRating * 10) / 10;
      product.review_count = allReviews.length;
      await product.save();
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    await Review.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
