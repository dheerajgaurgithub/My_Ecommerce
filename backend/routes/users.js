import express from 'express';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';
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
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const Order = (await import('../models/Order.js')).default;
    const Product = (await import('../models/Product.js')).default;
    const Category = (await import('../models/Category.js')).default;

    // Get total stats
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayOrders = await Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } });
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const todayUsers = await User.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } });

    // Get total revenue
    const allOrders = await Order.find({});
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);

    // Calculate conversion rate (orders / users)
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Sales over time (revenue chart)
    const ordersInRange = await Order.find({
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    const revenueChart = [];
    const orderMap = new Map();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      orderMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0 });
    }

    ordersInRange.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (orderMap.has(dateStr)) {
        const data = orderMap.get(dateStr);
        data.revenue += order.total;
        data.orders += 1;
      }
    });

    revenueChart.push(...Array.from(orderMap.values()));

    // Top products
    const productSales = new Map();
    ordersInRange.forEach(order => {
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
    const topSellingProducts = topProducts.map(p => ({
      name: p.name,
      sales: productSales.get(p._id)?.sales || 0,
      revenue: productSales.get(p._id)?.revenue || 0
    }));

    // Recent orders
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber total status createdAt');

    const recentOrdersFormatted = recentOrders.map(order => ({
      orderNumber: order.orderNumber || 'N/A',
      customer: 'Customer', // Would need to populate user data
      amount: order.total,
      status: order.status,
      date: order.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        totalOrders,
        todayOrders: todayOrders.length,
        totalUsers,
        todayUsers,
        totalProducts,
        conversionRate,
        averageOrderValue,
        topSellingProducts,
        recentOrders: recentOrdersFormatted,
        revenueChart
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
