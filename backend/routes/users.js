import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import Address from '../models/Address.js';

const router = express.Router();

// Get all users (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    const usersWithAddresses = await Promise.all(
      users.map(async (user) => {
        const addresses = await Address.find({ user_id: user._id });
        return {
          ...user.toObject(),
          addresses: addresses.map(a => ({
            pincode: a.pincode,
            city: a.city,
            state: a.state,
            address_line: a.address_line
          }))
        };
      })
    );
    res.json({ success: true, users: usersWithAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get analytics data (admin only)
router.get('/analytics', auth, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const Order = (await import('../models/Order.js')).default;
    const Product = (await import('../models/Product.js')).default;
    const Category = (await import('../models/Category.js')).default;

    // Sales over time
    const orders = await Order.find({
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    const salesOverTime = [];
    const orderMap = new Map();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      orderMap.set(dateStr, { date: date.toLocaleDateString(), sales: 0, orders: 0 });
    }

    orders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (orderMap.has(dateStr)) {
        const data = orderMap.get(dateStr);
        data.sales += order.total;
        data.orders += 1;
      }
    });

    salesOverTime.push(...Array.from(orderMap.values()));

    // Top products
    const productSales = new Map();
    orders.forEach(order => {
      order.items?.forEach(item => {
        const current = productSales.get(item.product_id) || { sales: 0, revenue: 0 };
        current.sales += item.quantity;
        current.revenue += item.price * item.quantity;
        productSales.set(item.product_id, current);
      });
    });

    const topProductIds = Array.from(productSales.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(e => e[0]);

    const topProducts = await Product.find({ _id: { $in: topProductIds } });
    const topProductsWithSales = topProducts.map(p => ({
      name: p.name,
      sales: productSales.get(p._id)?.sales || 0,
      revenue: productSales.get(p._id)?.revenue || 0
    }));

    // Category performance
    const categories = await Category.find({});
    const categoryPerformance = await Promise.all(
      categories.map(async (cat) => {
        const categoryOrders = orders.filter(o => 
          o.items?.some(item => {
            const product = topProducts.find(p => p._id === item.product_id);
            return product && product.category_id === cat._id;
          })
        );
        const revenue = categoryOrders.reduce((sum, o) => sum + o.total, 0);
        return {
          category: cat.name,
          revenue,
          percentage: orders.length > 0 ? (categoryOrders.length / orders.length) * 100 : 0
        };
      })
    );

    // Customer growth
    const customerMap = new Map();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      customerMap.set(dateStr, { date: date.toLocaleDateString(), customers: 0 });
    }

    const allUsers = await User.find({ createdAt: { $gte: startDate } }).sort({ createdAt: 1 });
    allUsers.forEach(user => {
      const dateStr = user.createdAt.toISOString().split('T')[0];
      if (customerMap.has(dateStr)) {
        customerMap.set(dateStr, { date: customerMap.get(dateStr).date, customers: customerMap.get(dateStr).customers + 1 });
      }
    });

    const customerGrowth = Array.from(customerMap.values());

    res.json({
      success: true,
      data: {
        salesOverTime,
        topProducts: topProductsWithSales,
        categoryPerformance,
        customerGrowth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check first order discount status
router.get('/first-order-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, hasUsedFirstOrderDiscount: user.hasUsedFirstOrderDiscount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, nickname, profilePicture, location, phone, latitude, longitude } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
