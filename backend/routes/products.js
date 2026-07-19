import express from 'express';
import Product from '../models/Product.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      filter, 
      sort, 
      minPrice, 
      maxPrice, 
      gender, 
      color, 
      q,
      limit = 60 
    } = req.query;

    let query = { is_published: true };

    // Search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      const Category = (await import('../models/Category.js')).default;
      const cat = await Category.findOne({ slug: category });
      if (cat) query.category_id = cat._id;
    }

    // Feature filters
    if (filter === 'trending') query.is_trending = true;
    if (filter === 'new') query.is_new_arrival = true;
    if (filter === 'bestseller') query.is_bestseller = true;
    if (filter === 'flash-sale') query.is_flash_sale = true;
    if (filter === 'premium') query.is_premium = true;

    // Price range
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };

    // Gender filter
    if (gender) query.gender = gender;

    // Color filter (client-side filtering for array)
    let products = await Product.find(query).populate('category_id').limit(Number(limit));

    // Filter by color
    if (color) {
      products = products.filter(p => p.colors.some(c => c.toLowerCase().includes(color.toLowerCase())));
    }

    // Sorting
    if (sort === 'price-low') products.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') products.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
    else if (sort === 'newest') products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else products.sort((a, b) => b.is_featured - a.is_featured);

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product by slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category_id');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create product (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, slug, price, stock, category_id } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    if (!price || isNaN(Number(price))) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }
    if (stock === undefined || stock === null || isNaN(Number(stock))) {
      return res.status(400).json({ success: false, message: 'Valid stock quantity is required' });
    }
    
    // Check if slug already exists
    if (slug) {
      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        return res.status(400).json({ success: false, message: 'A product with this slug already exists' });
      }
    }
    
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: `A product with this ${field} already exists` });
    }
    
    res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
  }
});

// Update product (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete product (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update stock
router.patch('/:id/stock', adminAuth, async (req, res) => {
  try {
    const { qty } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: -qty } },
      { new: true }
    );
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
