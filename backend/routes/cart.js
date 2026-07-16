import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const cartItems = await Cart.find({ 
      user_id: req.user._id, 
      saved_for_later: false 
    }).populate('product_id');
    res.json({ success: true, items: cartItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add to cart
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, quantity = 1, size, color, gift_wrap = false } = req.body;

    // Check if same product with same size/color exists
    let cartItem = await Cart.findOne({
      user_id: req.user._id,
      product_id,
      size: size || null,
      color: color || null,
      saved_for_later: false
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      if (gift_wrap !== undefined) cartItem.gift_wrap = gift_wrap;
      await cartItem.save();
    } else {
      cartItem = new Cart({
        user_id: req.user._id,
        product_id,
        quantity,
        size: size || null,
        color: color || null,
        gift_wrap
      });
      await cartItem.save();
    }

    const populatedItem = await Cart.findById(cartItem._id).populate('product_id');
    res.json({ success: true, item: populatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update cart item quantity
router.patch('/:id', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItem = await Cart.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { quantity },
      { new: true }
    ).populate('product_id');
    res.json({ success: true, item: cartItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from cart
router.delete('/:id', auth, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save for later
router.patch('/:id/save', auth, async (req, res) => {
  try {
    const { saved } = req.body;
    const cartItem = await Cart.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { saved_for_later: saved },
      { new: true }
    );
    res.json({ success: true, item: cartItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle gift wrap
router.patch('/:id/gift-wrap', auth, async (req, res) => {
  try {
    const { gift_wrap } = req.body;
    const cartItem = await Cart.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { gift_wrap },
      { new: true }
    ).populate('product_id');
    res.json({ success: true, item: cartItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    await Cart.deleteMany({ user_id: req.user._id, saved_for_later: false });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
