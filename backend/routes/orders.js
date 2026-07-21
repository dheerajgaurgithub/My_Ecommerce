import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Store from '../models/Store.js';
import { auth, adminAuth } from '../middleware/auth.js';
import emailService from '../services/emailService.js';
import { calculateDeliveryPayment, calculateRoundTripDistance } from '../utils/calculateDeliveryPayment.js';

const router = express.Router();

// Generate order number
const generateOrderNumber = () => {
  const prefix = 'MF';
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${Date.now().toString().slice(-6)}${random}`;
};

// Get active delivery partners for assignment
router.get('/active-delivery-partners', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const partners = await DeliveryPartner.find({
      status: { $in: ['active', 'approved', 'payment_pending'] }
    }).select('personalDetails.fullName personalDetails.contactNumber vehicleDetails.vehicleType vehicleDetails.vehicleNumber workDetails.totalDeliveries workDetails.isOnline status');

    res.json({ success: true, partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's orders (all orders for admin)
router.get('/', auth, async (req, res) => {
  try {
    // Admin can see all orders, regular users see only their own
    const filter = req.user.role === 'admin' ? {} : { user_id: req.user._id };
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.product_id');

    // Populate address details for orders that only have address_id
    const Address = (await import('../models/Address.js')).default;
    for (const order of orders) {
      if (order.address_snapshot instanceof Map) {
        const addressId = order.address_snapshot.get('address_id');
        if (addressId && !order.address_snapshot.get('full_name')) {
          const address = await Address.findById(addressId);
          if (address) {
            order.address_snapshot.set('full_name', address.full_name);
            order.address_snapshot.set('phone', address.phone);
            order.address_snapshot.set('address_line', address.address_line);
            order.address_snapshot.set('city', address.city);
            order.address_snapshot.set('district', address.district);
            order.address_snapshot.set('state', address.state);
            order.address_snapshot.set('pincode', address.pincode);
            order.address_snapshot.set('country', address.country);
          }
        }
      }
    }

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order
router.get('/:orderNumber', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      order_number: req.params.orderNumber,
      user_id: req.user._id 
    }).populate('items.product_id');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const {
      address_id,
      payment_method,
      delivery_type,
      coupon_code,
      payment_details
    } = req.body;

    // Get user to check for first order discount
    const user = await User.findById(req.user._id);
    let firstOrderDiscount = 0;
    let appliedFirstOrderDiscount = false;

    // Get cart items
    const cartItems = await Cart.find({ 
      user_id: req.user._id, 
      saved_for_later: false 
    }).populate('product_id');

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals from cart items
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product_id.price * item.quantity), 0);
    
    // Apply 10% first order discount if user hasn't used it yet
    if (!user.hasUsedFirstOrderDiscount) {
      firstOrderDiscount = Math.round(subtotal * 0.10);
      appliedFirstOrderDiscount = true;
    }

    // Get checkout data from session (simulated via request body for now)
    const discount = 0; // Will be calculated from coupon if provided
    const giftWrapFee = cartItems.reduce((sum, item) => sum + (item.gift_wrap ? 50 : 0), 0);
    const taxableAmount = subtotal - discount - firstOrderDiscount;
    const tax = Math.round(taxableAmount * 0.05);
    
    // Calculate shipping based on delivery type
    let shipping = 0;
    if (delivery_type === 'standard') {
      shipping = 49;
    }

    const total = subtotal - discount - firstOrderDiscount + tax + shipping + giftWrapFee;

    const orderNumber = generateOrderNumber();
    const isOnline = payment_method !== 'cod';

    const orderItems = cartItems.map(item => ({
      product_id: item.product_id._id,
      product_name: item.product_id.name,
      product_image: item.product_id.images[0] || null,
      price: item.product_id.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      gift_wrap: item.gift_wrap
    }));

    const timeline = [
      { status: 'Order Placed', timestamp: new Date() }
    ];

    if (isOnline) {
      timeline.push({ status: 'Payment Completed', timestamp: new Date() });
    }

    // Calculate final discount
    const finalDiscount = discount + firstOrderDiscount;

    // Get full address details
    const Address = (await import('../models/Address.js')).default;
    const address = await Address.findById(address_id);

    const addressSnapshot = new Map();
    if (address) {
      addressSnapshot.set('address_id', address_id);
      addressSnapshot.set('full_name', address.full_name);
      addressSnapshot.set('phone', address.phone);
      addressSnapshot.set('address_line', address.address_line);
      addressSnapshot.set('city', address.city);
      addressSnapshot.set('district', address.district);
      addressSnapshot.set('state', address.state);
      addressSnapshot.set('pincode', address.pincode);
      addressSnapshot.set('country', address.country);
    }

    const order = new Order({
      user_id: req.user._id,
      order_number: orderNumber,
      status: 'pending',
      total,
      subtotal,
      tax,
      shipping,
      discount: finalDiscount,
      coupon_code: coupon_code || null,
      payment_method: payment_method,
      payment_status: isOnline ? 'paid' : 'pending',
      paid_at: isOnline ? new Date() : null,
      payment_details: payment_details || null,
      address_snapshot: addressSnapshot,
      timeline,
      items: orderItems
    });

    await order.save();

    // Mark user as having used first order discount
    if (appliedFirstOrderDiscount) {
      await User.findByIdAndUpdate(req.user._id, { hasUsedFirstOrderDiscount: true });
    }

    // Create notification for user
    await Notification.create({
      user_id: req.user._id,
      title: 'Order Placed!',
      message: `Your order ${orderNumber} has been placed successfully. We will confirm your order shortly.`,
      type: 'order'
    });

    // Create notification for admin
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      await Notification.create({
        user_id: adminUser._id,
        title: 'New Order Received',
        message: `Order ${orderNumber} placed by ${user.name} (${user.email}). Total: ${finalTotal}.`,
        type: 'order'
      });

      // Additional notification for online payment
      if (isOnline) {
        await Notification.create({
          user_id: adminUser._id,
          title: 'Payment Completed',
          message: `Payment received for order ${orderNumber}. Amount: ${finalTotal}.`,
          type: 'order'
        });
      }
    }

    // Send order confirmation email
    await emailService.sendOrderConfirmationEmail(user.email, user.name, {
      order_number: orderNumber,
      total: finalTotal,
      createdAt: new Date(),
      items: orderItems
    });

    // Update product stock
    for (const item of cartItems) {
      await Product.findByIdAndUpdate(item.product_id._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear cart
    await Cart.deleteMany({ user_id: req.user._id, saved_for_later: false });

    res.status(201).json({ 
      success: true, 
      order,
      firstOrderDiscount: appliedFirstOrderDiscount ? firstOrderDiscount : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updateData = {
      status,
      $push: { timeline: { status: status.charAt(0).toUpperCase() + status.slice(1), timestamp: new Date() } }
    };

    // COD payment is marked paid when order is delivered
    if (status === 'delivered' && order.payment_method === 'cod' && order.payment_status !== 'paid') {
      updateData.payment_status = 'paid';
      updateData.paid_at = new Date();
      updateData.$push.timeline.push({ status: 'Payment Completed (COD)', timestamp: new Date() });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Create notification for user when status changes
    const statusMessages = {
      'confirmed': 'Your order has been confirmed and is being processed.',
      'packed': 'Your order has been packed and is ready for shipment.',
      'shipped': 'Your order has been shipped and is on its way!',
      'out_for_delivery': 'Your order is out for delivery and will reach you soon.',
      'delivered': 'Your order has been delivered successfully. Thank you for shopping with us!',
      'cancelled': 'Your order has been cancelled. We apologize for the inconvenience.'
    };

    if (statusMessages[status]) {
      await Notification.create({
        user_id: order.user_id,
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Order ${order.order_number}: ${statusMessages[status]}`,
        type: 'order'
      });

      // Send delivery update email
      const orderUser = await User.findById(order.user_id);
      if (orderUser) {
        await emailService.sendDeliveryUpdateEmail(orderUser.email, orderUser.name, updatedOrder, status);
      }
    }

    // Notify admin when order is cancelled
    if (status === 'cancelled') {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        await Notification.create({
          user_id: adminUser._id,
          title: 'Order Cancelled',
          message: `Order ${order.order_number} has been cancelled.`,
          type: 'order'
        });
      }
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assign delivery partner to order
router.put('/:id/assign-partner', adminAuth, async (req, res) => {
  try {

    const { partnerId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    // Get store details
    const store = await Store.findOne({ is_active: true });
    if (!store) {
      return res.status(404).json({ success: false, message: 'No active store found' });
    }

    console.log('Store data:', JSON.stringify(store, null, 2));

    // Generate OTPs for pickup and delivery
    const pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Ensure coordinates are always provided
    const storeLat = store.coordinates?.lat || 27.8974;
    const storeLng = store.coordinates?.lng || 78.0880;

    console.log('Coordinates:', { storeLat, storeLng });

    // Calculate round-trip distance for payment calculation
    const roundTripDistance = calculateRoundTripDistance(
      storeLat,
      storeLng,
      27.8974, // Default customer coordinates (should be fetched from order address)
      78.0880
    );

    // Calculate payment based on distance
    const paymentCalculation = calculateDeliveryPayment(roundTripDistance);

    // Create delivery order
    const deliveryOrder = new DeliveryOrder({
      orderId: order._id,
      deliveryPartnerId: partnerId,
      storeId: store._id,
      customerDetails: {
        name: 'Customer',
        contactNumber: 'N/A',
        address: order.address_snapshot?.get('address') || 'N/A',
        coordinates: { latitude: 27.8974, longitude: 78.0880 }
      },
      pickupDetails: {
        address: store.fullAddress || store.address?.street + ', ' + store.address?.city,
        coordinates: {
          latitude: storeLat,
          longitude: storeLng
        },
        contactNumber: store.phone || '+91-XXXXXXXXXX',
        pickupOTP
      },
      deliveryDetails: {
        deliveryOTP,
        estimatedDistance: roundTripDistance,
        estimatedDuration: 30 // Default 30 minutes
      },
      payment: {
        deliveryFee: paymentCalculation.baseFee,
        distanceFee: paymentCalculation.distanceFee,
        bonus: paymentCalculation.bonus,
        totalEarning: paymentCalculation.totalEarning
      },
      timeline: [{
        status: 'assigned',
        timestamp: new Date(),
        notes: 'Order assigned to delivery partner'
      }]
    });

    await deliveryOrder.save();

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        'delivery.assigned': true,
        'delivery.partnerId': partnerId,
        'delivery.pickupOTP': pickupOTP,
        'delivery.deliveryOTP': deliveryOTP,
        'delivery.storeAddress': store.fullAddress || store.address?.street + ', ' + store.address?.city,
        'delivery.storeCoordinates': { latitude: storeLat, longitude: storeLng },
        'delivery.storeContact': store.phone || '+91-XXXXXXXXXX',
        status: 'out_for_delivery',
        $push: { timeline: { status: 'Out for Delivery', timestamp: new Date() } }
      },
      { new: true }
    );

    // Create notification for delivery partner
    await Notification.create({
      user_id: partner.userId,
      title: 'New Order Assigned',
      message: `Order ${order.order_number} has been assigned to you for delivery.`,
      type: 'order'
    });

    res.json({ success: true, order: updatedOrder, deliveryOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
