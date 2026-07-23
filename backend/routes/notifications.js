import express from 'express';
import Notification from '../models/Notification.js';
import { auth, adminAuth, deliveryAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    // Admin gets admin notifications, regular users get their own notifications
    const filter = req.user.role === 'admin' ? { for_admin: true } : { user_id: req.user._id, for_admin: false };
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get delivery partner's notifications
router.get('/delivery-partner', deliveryAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      delivery_partner_id: req.deliveryPartner._id,
      for_delivery_partner: true
    })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { for_admin: true, is_read: false } : { user_id: req.user._id, for_admin: false, is_read: false };
    const count = await Notification.countDocuments(filter);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get delivery partner unread count
router.get('/delivery-partner/unread-count', deliveryAuth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      delivery_partner_id: req.deliveryPartner._id,
      for_delivery_partner: true,
      is_read: false
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id },
      { is_read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark delivery partner notification as read
router.patch('/delivery-partner/:id/read', deliveryAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, delivery_partner_id: req.deliveryPartner._id },
      { is_read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { for_admin: true } : { user_id: req.user._id, for_admin: false };
    await Notification.updateMany(filter, { is_read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all delivery partner notifications as read
router.patch('/delivery-partner/read-all', deliveryAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { delivery_partner_id: req.deliveryPartner._id, for_delivery_partner: true },
      { is_read: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete single notification (must come before delete all)
router.delete('/:id', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id, for_admin: true } : { _id: req.params.id, user_id: req.user._id, for_admin: false };
    const notification = await Notification.findOneAndDelete(filter);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete single delivery partner notification
router.delete('/delivery-partner/:id', deliveryAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      delivery_partner_id: req.deliveryPartner._id,
      for_delivery_partner: true
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete all notifications
router.delete('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { for_admin: true } : { user_id: req.user._id, for_admin: false };
    await Notification.deleteMany(filter);
    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete all delivery partner notifications
router.delete('/delivery-partner', deliveryAuth, async (req, res) => {
  try {
    await Notification.deleteMany({
      delivery_partner_id: req.deliveryPartner._id,
      for_delivery_partner: true
    });
    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create notification (internal use)
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
