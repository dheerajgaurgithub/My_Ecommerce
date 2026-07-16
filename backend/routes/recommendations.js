import express from 'express';
import { auth } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get personalized recommendations for a user
router.get('/personalized', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's order history
    const orders = await Order.find({ user_id: userId })
      .populate('items.product_id')
      .sort({ createdAt: -1 })
      .limit(20);

    // Extract product categories and brands from order history
    const purchasedCategories = new Set();
    const purchasedBrands = new Set();
    const purchasedProductIds = new Set();

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product_id) {
          if (item.product_id.category_id) purchasedCategories.add(item.product_id.category_id);
          if (item.product_id.brand) purchasedBrands.add(item.product_id.brand);
          purchasedProductIds.add(item.product_id._id);
        }
      });
    });

    // Build recommendation query
    const recommendations = await Product.find({
      _id: { $nin: Array.from(purchasedProductIds) },
      is_published: true,
      stock: { $gt: 0 },
      $or: [
        { category_id: { $in: Array.from(purchasedCategories) } },
        { brand: { $in: Array.from(purchasedBrands) } }
      ]
    })
    .limit(limit)
    .sort({ rating: -1, review_count: -1 });

    // If not enough recommendations, add trending products
    if (recommendations.length < limit) {
      const trending = await Product.find({
        _id: { $nin: Array.from(purchasedProductIds).concat(recommendations.map(p => p._id)) },
        is_published: true,
        stock: { $gt: 0 }
      })
      .limit(limit - recommendations.length)
      .sort({ is_trending: -1, rating: -1 });

      recommendations.push(...trending);
    }

    res.json({
      success: true,
      recommendations,
      algorithm: 'collaborative-filtering'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get similar products
router.get('/similar/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 8;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const similarProducts = await Product.find({
      _id: { $ne: productId },
      is_published: true,
      stock: { $gt: 0 },
      $or: [
        { category_id: product.category_id },
        { brand: product.brand },
        { tags: { $in: product.tags } }
      ]
    })
    .limit(limit)
    .sort({ rating: -1 });

    res.json({
      success: true,
      similarProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get trending products
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;

    const trendingProducts = await Product.find({
      is_published: true,
      stock: { $gt: 0 }
    })
    .limit(limit)
    .sort({ is_trending: -1, rating: -1, review_count: -1 });

    res.json({
      success: true,
      trendingProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get frequently bought together products
router.get('/frequently-bought-together/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 6;

    // Find orders that contain this product
    const ordersWithProduct = await Order.find({
      'items.product_id': productId
    }).limit(50);

    // Find other products frequently bought with this one
    const productFrequency = new Map();

    ordersWithProduct.forEach(order => {
      order.items.forEach(item => {
        if (item.product_id && item.product_id.toString() !== productId) {
          const productIdStr = item.product_id.toString();
          productFrequency.set(productIdStr, (productFrequency.get(productIdStr) || 0) + 1);
        }
      });
    });

    // Sort by frequency and get top products
    const sortedProductIds = Array.from(productFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);

    const frequentlyBoughtTogether = await Product.find({
      _id: { $in: sortedProductIds },
      is_published: true,
      stock: { $gt: 0 }
    });

    // Sort by frequency
    frequentlyBoughtTogether.sort((a, b) => {
      const freqA = productFrequency.get(a._id.toString()) || 0;
      const freqB = productFrequency.get(b._id.toString()) || 0;
      return freqB - freqA;
    });

    res.json({
      success: true,
      frequentlyBoughtTogether
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
