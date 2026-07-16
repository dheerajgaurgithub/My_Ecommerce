import express from 'express';
import Coupon from '../models/Coupon.js';

const router = express.Router();

// Get all active coupons
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({ is_active: true });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Validate coupon
router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      is_active: true 
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    // Check minimum order
    if (orderTotal < coupon.min_order) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order of ₹${coupon.min_order} required` 
      });
    }

    // Check validity dates
    const now = new Date();
    if (coupon.valid_from && now < coupon.valid_from) {
      return res.status(400).json({ success: false, message: 'Coupon not yet valid' });
    }
    if (coupon.valid_until && now > coupon.valid_until) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (orderTotal * coupon.discount_value) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else {
      discount = coupon.discount_value;
    }

    res.json({ success: true, coupon, discount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create coupon (Admin only - would need admin middleware)
router.post('/', async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
