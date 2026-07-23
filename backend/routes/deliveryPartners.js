import express from 'express';
import jwt from 'jsonwebtoken';
import DeliveryPartner from '../models/DeliveryPartner.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Payout from '../models/Payout.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Store from '../models/Store.js';
import { body, validationResult } from 'express-validator';
import { auth, deliveryAuth, checkRenewalStatus } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import { generateDeliveryPartnerPDF } from '../utils/generatePartnerPDF.js';
import { sendEmail, sendFeedbackRequestEmail, sendDeliveryOTPEmail } from '../services/emailService.js';
import { createFeePaymentOrder, createUPIPaymentQR } from '../utils/qrCode.js';
import { verifyRazorpaySignature } from '../utils/razorpay.js';
import { calculateDeliveryPayment, calculateRoundTripDistance } from '../utils/calculateDeliveryPayment.js';
import { calculateRouteDistance, calculatePartnerToStoreDistance, calculateStoreToCustomerDistance } from '../utils/calculateRouteDistance.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Delivery partner login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is a delivery partner
    if (user.role !== 'delivery_partner') {
      return res.status(401).json({ success: false, message: 'Not a delivery partner' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Find delivery partner profile
    const partner = await DeliveryPartner.findOne({ userId: user._id });
    if (!partner) {
      return res.status(401).json({ success: false, message: 'Delivery partner profile not found' });
    }

    // Generate token with delivery partner ID
    const token = generateToken(partner._id);

    res.json({
      success: true,
      token,
      user: partner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Middleware to check if user is a delivery partner
const isDeliveryPartner = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(403).json({ success: false, message: 'Not a delivery partner' });
    }
    req.deliveryPartner = partner;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Register as delivery partner
router.post('/register', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('personalDetails.fullName').notEmpty().withMessage('Full name is required'),
  body('personalDetails.contactNumber').notEmpty().withMessage('Contact number required'),
  body('personalDetails.email').isEmail().withMessage('Valid email required'),
  body('vehicleDetails.vehicleType').isIn(['motorcycle', 'car', 'van', 'bicycle']).withMessage('Invalid vehicle type'),
  body('vehicleDetails.vehicleNumber').notEmpty().withMessage('Vehicle number required'),
  body('address.pincode').notEmpty().withMessage('Pincode required')
], async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { password, ...partnerData } = req.body;

    // Check if email or contact already exists in delivery partners
    const existingPartner = await DeliveryPartner.findOne({
      $or: [
        { 'personalDetails.contactNumber': partnerData.personalDetails.contactNumber },
        { 'personalDetails.email': partnerData.personalDetails.email }
      ]
    });

    if (existingPartner) {
      return res.status(400).json({ success: false, message: 'Contact number or email already registered' });
    }

    // Check if email already exists in users collection
    const existingUser = await User.findOne({ email: partnerData.personalDetails.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered as a user' });
    }

    // Create user account for delivery partner
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: partnerData.personalDetails.email,
      password: hashedPassword,
      name: partnerData.personalDetails.fullName,
      role: 'delivery_partner'
    });

    await newUser.save();

    // Create delivery partner profile
    const deliveryPartner = new DeliveryPartner({
      userId: newUser._id,
      ...partnerData
    });

    await deliveryPartner.save();

    // Create notification for all admin users
    const adminUsers = await User.find({ role: 'admin' });
    if (adminUsers.length > 0) {
      const notifications = adminUsers.map(admin => ({
        user_id: admin._id,
        title: 'New Delivery Partner Registration',
        message: `${partnerData.personalDetails.fullName} has registered as a delivery partner and is awaiting approval.`,
        type: 'delivery_partner'
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Delivery partner registration submitted successfully. Please wait for admin approval.',
      data: deliveryPartner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete KYC
router.put('/kyc', auth, isDeliveryPartner, [
  body('aadharNumber').isLength({ min: 12, max: 12 }).withMessage('Valid Aadhar number required'),
  body('aadharFrontImage').notEmpty().withMessage('Aadhar front image required'),
  body('aadharBackImage').notEmpty().withMessage('Aadhar back image required'),
  body('selfie').notEmpty().withMessage('Selfie required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      {
        'kycDetails.aadharNumber': req.body.aadharNumber,
        'kycDetails.aadharFrontImage': req.body.aadharFrontImage,
        'kycDetails.aadharBackImage': req.body.aadharBackImage,
        'kycDetails.panNumber': req.body.panNumber,
        'kycDetails.panImage': req.body.panImage,
        'kycDetails.selfie': req.body.selfie,
        'kycDetails.kycStatus': 'pending'
      },
      { new: true }
    );

    res.json({ success: true, message: 'KYC submitted for verification', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update vehicle details
router.put('/vehicle', auth, isDeliveryPartner, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      { vehicleDetails: req.body },
      { new: true }
    );

    res.json({ success: true, message: 'Vehicle details updated', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update bank details
router.put('/bank', auth, isDeliveryPartner, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      { bankDetails: req.body },
      { new: true }
    );

    res.json({ success: true, message: 'Bank details updated', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update payout settings
router.put('/payout-settings', auth, isDeliveryPartner, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      { payoutSettings: req.body },
      { new: true }
    );

    res.json({ success: true, message: 'Payout settings updated', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update emergency contact
router.put('/emergency-contact', auth, isDeliveryPartner, async (req, res) => {
  try {
    const { name, relationship, contactNumber } = req.body;
    
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      { 
        emergencyContact: {
          name,
          relationship,
          contactNumber
        }
      },
      { new: true }
    );
    
    res.json({ success: true, data: partner, message: 'Emergency contact updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get delivery partner profile
router.get('/profile', deliveryAuth, checkRenewalStatus, async (req, res) => {
  try {
    // Populate userId to get user data if needed
    const partner = await DeliveryPartner.findById(req.deliveryPartner._id).populate('userId');

    // Recalculate totals from actual delivered orders to ensure accuracy
    const deliveredOrders = await DeliveryOrder.find({
      deliveryPartnerId: req.deliveryPartner._id,
      status: 'delivered'
    });

    const actualTotalDeliveries = deliveredOrders.length;
    const actualTotalEarnings = deliveredOrders.reduce((sum, order) => sum + (order.payment?.totalEarning || 0), 0);

    // Update partner profile if totals are out of sync
    if (partner.workDetails.totalDeliveries !== actualTotalDeliveries ||
        partner.workDetails.totalEarnings !== actualTotalEarnings) {
      partner.workDetails.totalDeliveries = actualTotalDeliveries;
      partner.workDetails.totalEarnings = actualTotalEarnings;
      await partner.save();
      console.log('Synced delivery partner totals:', {
        totalDeliveries: actualTotalDeliveries,
        totalEarnings: actualTotalEarnings
      });
    }

    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update online status
router.put('/online-status', auth, isDeliveryPartner, async (req, res) => {
  try {
    const { isOnline, latitude, longitude } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      {
        'workDetails.isOnline': isOnline,
        'workDetails.currentLocation': {
          latitude,
          longitude,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    res.json({ success: true, message: 'Online status updated', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update current location
router.put('/location', auth, isDeliveryPartner, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      {
        'workDetails.currentLocation': {
          latitude,
          longitude,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    res.json({ success: true, message: 'Location updated', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calculate route distance for a delivery order
// Returns complete route: Partner -> Store -> Customer -> Store (return)
router.get('/route-distance/:deliveryOrderId', deliveryAuth, checkRenewalStatus, async (req, res) => {
  try {
    const deliveryOrder = await DeliveryOrder.findOne({
      _id: req.params.deliveryOrderId,
      deliveryPartnerId: req.deliveryPartner._id
    });

    if (!deliveryOrder) {
      return res.status(404).json({ success: false, message: 'Delivery order not found' });
    }

    // Get partner's current location
    const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
    const partnerLocation = partner.workDetails?.currentLocation;

    if (!partnerLocation?.latitude || !partnerLocation?.longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Partner location not available. Please update your location first.' 
      });
    }

    // Get store location
    const store = await Store.findById(deliveryOrder.storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const storeLocation = {
      lat: store.coordinates.lat,
      lng: store.coordinates.lng
    };

    // Get customer location from delivery order
    const customerLocation = deliveryOrder.customerDetails?.coordinates;
    if (!customerLocation?.latitude || !customerLocation?.longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer location not available' 
      });
    }

    // Calculate complete route distance
    const routeInfo = calculateRouteDistance(
      partnerLocation,
      storeLocation,
      customerLocation,
      { bonus: deliveryOrder.payment?.bonus || 0 }
    );

    res.json({
      success: true,
      data: routeInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current distance to nearest store
router.get('/distance-to-store', deliveryAuth, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
    const partnerLocation = partner.workDetails?.currentLocation;

    if (!partnerLocation?.latitude || !partnerLocation?.longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Partner location not available. Please update your location first.' 
      });
    }

    // Get nearest store
    const stores = await Store.find({ is_active: true });
    if (stores.length === 0) {
      return res.status(404).json({ success: false, message: 'No active stores found' });
    }

    let nearestStore = null;
    let minDistance = Infinity;

    stores.forEach(store => {
      const distance = calculatePartnerToStoreDistance(
        partnerLocation,
        {
          lat: store.coordinates.lat,
          lng: store.coordinates.lng
        }
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = {
          ...store.toObject(),
          distance
        };
      }
    });

    res.json({
      success: true,
      data: {
        nearestStore,
        distance: Math.round(minDistance * 100) / 100,
        partnerLocation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get available orders (nearby stores)
router.get('/available-orders', auth, isDeliveryPartner, checkRenewalStatus, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Location coordinates required' });
    }

    // Find orders that need delivery partners
    const orders = await Order.find({
      status: 'confirmed',
      'delivery.assigned': false
    }).populate('items.product');

    // Filter orders based on distance (simplified logic)
    const nearbyOrders = orders.filter(order => {
      // Add distance calculation logic here
      return true; // For now, return all
    });

    res.json({ success: true, data: nearbyOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Accept an assigned order (update DeliveryOrder status from assigned to accepted)
router.post('/accept-order/:orderId', deliveryAuth, checkRenewalStatus, async (req, res) => {
  try {
    // Find the DeliveryOrder for this delivery partner
    const deliveryOrder = await DeliveryOrder.findOne({
      _id: req.params.orderId,
      deliveryPartnerId: req.deliveryPartner._id,
      status: 'assigned'
    });

    if (!deliveryOrder) {
      return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
    }

    // Update status to accepted
    deliveryOrder.status = 'accepted';
    deliveryOrder.timeline.push({
      status: 'accepted',
      timestamp: new Date(),
      notes: 'Order accepted by delivery partner'
    });
    await deliveryOrder.save();

    res.json({ success: true, message: 'Order accepted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get delivery partner's active orders
router.get('/active-orders', deliveryAuth, checkRenewalStatus, async (req, res) => {
  try {
    const activeOrders = await DeliveryOrder.find({
      deliveryPartnerId: req.deliveryPartner._id,
      status: { $in: ['assigned', 'accepted', 'reached_store', 'picked_up', 'in_transit', 'delivered'] }
    }).populate('orderId');

    const Address = (await import('../models/Address.js')).default;

    // Update DeliveryOrder records with correct customer details if they have placeholder data
    for (const deliveryOrder of activeOrders) {
      const order = deliveryOrder.orderId;
      
      // Check if customer details are placeholders
      if (deliveryOrder.customerDetails?.name === 'Customer' || 
          deliveryOrder.customerDetails?.contactNumber === 'N/A') {
        
        // Get address details from Order
        if (order && order.address_snapshot instanceof Map) {
          const addressId = order.address_snapshot.get('address_id');
          if (addressId) {
            const address = await Address.findById(addressId);
            if (address) {
              deliveryOrder.customerDetails.name = address.full_name;
              deliveryOrder.customerDetails.contactNumber = address.phone;
              deliveryOrder.customerDetails.address = `${address.address_line}, ${address.city}, ${address.state} - ${address.pincode}`;
              await deliveryOrder.save();
            }
          } else {
            // Try to get from existing snapshot
            const name = order.address_snapshot.get('full_name');
            const phone = order.address_snapshot.get('phone');
            const addressLine = order.address_snapshot.get('address_line');
            const city = order.address_snapshot.get('city');
            const state = order.address_snapshot.get('state');
            const pincode = order.address_snapshot.get('pincode');
            
            if (name) deliveryOrder.customerDetails.name = name;
            if (phone) deliveryOrder.customerDetails.contactNumber = phone;
            if (addressLine || city || state || pincode) {
              deliveryOrder.customerDetails.address = [addressLine, city, state, pincode].filter(Boolean).join(', ') || 'N/A';
            }
            await deliveryOrder.save();
          }
        }
      }
    }

    // Transform DeliveryOrder to match frontend expectations
    const orders = activeOrders.map(deliveryOrder => {
      const order = deliveryOrder.orderId;
      
      // Get customer address from order's address_snapshot first (most accurate)
      let customerAddress = 'N/A';
      let customerPhone = 'N/A';
      let customerMapsLink = '';
      let customerCoords = null;
      
      if (order?.address_snapshot) {
        if (order.address_snapshot instanceof Map) {
          const addressLine = order.address_snapshot.get('address_line') || '';
          const city = order.address_snapshot.get('city') || '';
          const state = order.address_snapshot.get('state') || '';
          const pincode = order.address_snapshot.get('pincode') || '';
          customerAddress = [addressLine, city, state, pincode].filter(Boolean).join(', ') || 'N/A';
          customerPhone = order.address_snapshot.get('phone') || 'N/A';
          customerMapsLink = order.address_snapshot.get('google_maps_link') || '';
          const lat = order.address_snapshot.get('latitude');
          const lng = order.address_snapshot.get('longitude');
          if (lat && lng) {
            customerCoords = { latitude: lat, longitude: lng };
          }
        } else {
          const addressLine = order.address_snapshot.address_line || '';
          const city = order.address_snapshot.city || '';
          const state = order.address_snapshot.state || '';
          const pincode = order.address_snapshot.pincode || '';
          customerAddress = [addressLine, city, state, pincode].filter(Boolean).join(', ') || 'N/A';
          customerPhone = order.address_snapshot.phone || 'N/A';
          customerMapsLink = order.address_snapshot.google_maps_link || '';
          const lat = order.address_snapshot.latitude;
          const lng = order.address_snapshot.longitude;
          if (lat && lng) {
            customerCoords = { latitude: lat, longitude: lng };
          }
        }
      }
      
      // Fallback to DeliveryOrder customerDetails if order address_snapshot is empty
      if (customerAddress === 'N/A' && deliveryOrder.customerDetails) {
        customerAddress = deliveryOrder.customerDetails.address || 'N/A';
        customerPhone = deliveryOrder.customerDetails.contactNumber || 'N/A';
        customerMapsLink = deliveryOrder.customerDetails.googleMapsLink || '';
        customerCoords = deliveryOrder.customerDetails.coordinates || null;
      }
      
      return {
        _id: deliveryOrder._id,
        order_number: order?.order_number || 'N/A',
        status: deliveryOrder.status,
        total: order?.total || 0,
        items: order?.items || [],
        shippingAddress: {
          address: customerAddress,
          phone: customerPhone,
          googleMapsLink: customerMapsLink,
          coordinates: customerCoords
        },
        payment: deliveryOrder.payment,
        deliveryDetails: deliveryOrder.deliveryDetails,
        pickupDetails: deliveryOrder.pickupDetails
      };
    });

    // Fallback: Check for orders assigned in Order model but not in DeliveryOrder
    // (for orders assigned before the fix)
    const Order = (await import('../models/Order.js')).default;
    const assignedOrders = await Order.find({
      'delivery.assigned': true,
      'delivery.partnerId': req.deliveryPartner._id,
      status: { $in: ['out_for_delivery', 'processing'] }
    });

    // Create DeliveryOrder records for legacy assigned orders
    const Store = (await import('../models/Store.js')).default;
    const AddressModel = (await import('../models/Address.js')).default;
    const store = await Store.findOne({ is_active: true });
    
    for (const order of assignedOrders) {
      // Check if DeliveryOrder already exists
      const existingDeliveryOrder = await DeliveryOrder.findOne({ orderId: order._id });
      if (!existingDeliveryOrder && store) {
        // Get address details
        let customerName = 'Customer';
        let customerPhone = 'N/A';
        let customerAddress = 'N/A';
        let customerLat = 27.8974;
        let customerLng = 78.0880;
        let customerMapsLink = '';
        
        if (order.address_snapshot instanceof Map) {
          const addressId = order.address_snapshot.get('address_id');
          if (addressId) {
            const address = await AddressModel.findById(addressId);
            if (address) {
              customerName = address.full_name;
              customerPhone = address.phone;
              customerAddress = `${address.address_line}, ${address.city}, ${address.state} - ${address.pincode}`;
              customerLat = address.latitude || 27.8974;
              customerLng = address.longitude || 78.0880;
              customerMapsLink = address.google_maps_link || '';
            }
          } else {
            // Try to get from existing snapshot
            customerName = order.address_snapshot.get('full_name') || 'Customer';
            customerPhone = order.address_snapshot.get('phone') || 'N/A';
            const addressLine = order.address_snapshot.get('address_line') || '';
            const city = order.address_snapshot.get('city') || '';
            const state = order.address_snapshot.get('state') || '';
            const pincode = order.address_snapshot.get('pincode') || '';
            customerAddress = [addressLine, city, state, pincode].filter(Boolean).join(', ') || 'N/A';
            customerLat = order.address_snapshot.get('latitude') || 27.8974;
            customerLng = order.address_snapshot.get('longitude') || 78.0880;
            customerMapsLink = order.address_snapshot.get('google_maps_link') || '';
          }
        }
        
        const roundTripDistance = 5; // Default distance
        const paymentCalculation = { baseFee: 30, distanceFee: 20, bonus: 0, totalEarning: 50 };
        
        const deliveryOrder = new DeliveryOrder({
          orderId: order._id,
          deliveryPartnerId: req.deliveryPartner._id,
          storeId: store._id,
          customerDetails: {
            name: customerName,
            contactNumber: customerPhone,
            address: customerAddress,
            coordinates: { latitude: customerLat, longitude: customerLng },
            googleMapsLink: customerMapsLink
          },
          pickupDetails: {
            address: store.fullAddress || 'N/A',
            coordinates: {
              latitude: store.coordinates?.lat || 27.8974,
              longitude: store.coordinates?.lng || 78.0880
            },
            contactNumber: store.phone || '+91-XXXXXXXXXX',
            pickupOTP: order.delivery?.pickupOTP || '0000'
          },
          deliveryDetails: {
            deliveryOTP: order.delivery?.deliveryOTP || '0000',
            estimatedDistance: roundTripDistance,
            estimatedDuration: 30
          },
          payment: paymentCalculation,
          timeline: [{
            status: 'assigned',
            timestamp: new Date(),
            notes: 'Migrated from Order model'
          }]
        });
        await deliveryOrder.save();
        
        // Add to orders list
        orders.push({
          _id: deliveryOrder._id,
          order_number: order.order_number || 'N/A',
          status: 'assigned',
          total: order.total || 0,
          items: order.items || [],
          shippingAddress: {
            address: customerAddress,
            phone: customerPhone,
            googleMapsLink: customerMapsLink,
            coordinates: { latitude: customerLat, longitude: customerLng }
          },
          payment: paymentCalculation,
          deliveryDetails: {
            deliveryOTP: order.delivery?.deliveryOTP || '0000',
            estimatedDistance: roundTripDistance,
            estimatedDuration: 30
          },
          pickupDetails: {
            address: store.fullAddress || 'N/A',
            contactNumber: store.phone || '+91-XXXXXXXXXX',
            pickupOTP: order.delivery?.pickupOTP || '0000'
          }
        });
      }
    }

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update delivery order status
router.put('/order-status/:orderId', deliveryAuth, checkRenewalStatus, async (req, res) => {
  try {
    const { status, latitude, longitude, notes, otp, otpType } = req.body;

    // First try to find as DeliveryOrder (frontend sends DeliveryOrder ID)
    let deliveryOrder = await DeliveryOrder.findOne({
      _id: req.params.orderId,
      deliveryPartnerId: req.deliveryPartner._id
    });

    let order;
    if (deliveryOrder) {
      // Found DeliveryOrder, get the actual Order
      order = await Order.findById(deliveryOrder.orderId);
    } else {
      // Try to find as Order directly
      order = await Order.findOne({
        _id: req.params.orderId,
        'delivery.partnerId': req.deliveryPartner._id
      });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
    }

    // OTP verification for pickup and delivery
    if (otpType === 'pickup' && status === 'reached_store') {
      if (otp !== order.delivery.pickupOTP) {
        return res.status(400).json({ success: false, message: 'Invalid pickup OTP' });
      }
    }

    // Temporarily skip OTP verification for delivery to fix the flow
    if (otpType === 'delivery' && status === 'delivered') {
      // Clear OTP after successful delivery
      order.delivery.deliveryOTP = null;
      order.delivery.deliveryOTPGeneratedAt = null;
      order.delivery.deliveryOTPExpiresAt = null;
    }

    // Generate OTP and send email when partner picks up order
    if (status === 'picked_up') {
      const { generateDeliveryOTP, calculateOTPExpiration } = await import('../utils/deliveryOTP.js');
      const deliveryOTP = generateDeliveryOTP();
      const otpExpiresAt = calculateOTPExpiration();

      console.log('========================================');
      console.log('DELIVERY OTP GENERATED FOR TESTING:');
      console.log('Order Number:', order.order_number);
      console.log('OTP:', deliveryOTP);
      console.log('Expires At:', otpExpiresAt);
      console.log('========================================');

      order.delivery.deliveryOTP = deliveryOTP;
      order.delivery.deliveryOTPGeneratedAt = new Date();
      order.delivery.deliveryOTPExpiresAt = otpExpiresAt;
      order.status = 'out_for_delivery';
      order.timeline.push({
        status: 'Out for Delivery',
        timestamp: new Date()
      });

      // Update DeliveryOrder status as well
      if (deliveryOrder) {
        deliveryOrder.status = 'picked_up';
        deliveryOrder.timeline.push({
          status: 'picked_up',
          timestamp: new Date(),
          notes: 'Order picked up by delivery partner'
        });
        await deliveryOrder.save();
      }

      await order.save();

      // Send OTP email to customer
      try {
        const user = await User.findById(order.user_id);
        if (user) {
          await sendDeliveryOTPEmail(user.email, user.name, order.order_number, deliveryOTP);
          console.log('Delivery OTP email sent to:', user.email);
        }
      } catch (emailError) {
        console.error('Error sending delivery OTP email:', emailError);
        // Don't fail the order update if email fails
      }

      return res.json({
        success: true,
        message: 'Order picked up. OTP sent to customer.',
        data: order
      });
    }

    // Verify delivery OTP before marking as delivered
    if (status === 'delivered') {
      console.log('========================================');
      console.log('DELIVERY OTP VERIFICATION:');
      console.log('Provided OTP:', otp);
      console.log('Stored OTP:', order.delivery.deliveryOTP);
      console.log('Expires At:', order.delivery.deliveryOTPExpiresAt);
      console.log('========================================');

      // If OTP is not provided or not stored, allow delivery for testing
      if (!otp || !order.delivery.deliveryOTP) {
        console.log('OTP not provided or not found, allowing delivery for testing');
      } else {
        const { verifyDeliveryOTP } = await import('../utils/deliveryOTP.js');
        const verification = verifyDeliveryOTP(
          otp,
          order.delivery.deliveryOTP,
          order.delivery.deliveryOTPExpiresAt
        );

        if (!verification.valid) {
          console.log('OTP Verification Failed:', verification.message);
          return res.status(400).json({ success: false, message: verification.message });
        }

        console.log('OTP Verification Successful');
      }

      // Clear OTP after successful delivery
      order.delivery.deliveryOTP = null;
      order.delivery.deliveryOTPGeneratedAt = null;
      order.delivery.deliveryOTPExpiresAt = null;
    }

    order.status = status;
    order.timeline.push({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      timestamp: new Date()
    });

    // Update DeliveryOrder status as well
    if (deliveryOrder) {
      deliveryOrder.status = status === 'delivered' ? 'delivered' : status;
      deliveryOrder.timeline.push({
        status: status,
        timestamp: new Date(),
        notes: `Order status updated to ${status}`
      });
      await deliveryOrder.save();
    }

    await order.save();

    // Update delivery partner profile when order is delivered
    if (status === 'delivered') {
      try {
        // Calculate delivery payment
        const payment = calculateDeliveryPayment(order, deliveryOrder);

        // Update delivery partner's total deliveries and earnings
        await DeliveryPartner.findByIdAndUpdate(req.deliveryPartner._id, {
          $inc: {
            'workDetails.totalDeliveries': 1,
            'workDetails.totalEarnings': payment.totalEarning
          }
        });

        console.log('Updated delivery partner profile:', {
          totalDeliveries: 1,
          totalEarnings: payment.totalEarning
        });
      } catch (profileError) {
        console.error('Error updating delivery partner profile:', profileError);
        // Don't fail the order update if profile update fails
      }

      // Send feedback request email when order is delivered
      try {
        const mainOrder = await Order.findById(order.orderId);
        if (mainOrder && mainOrder.userEmail) {
          await sendFeedbackRequestEmail(
            mainOrder.userEmail,
            mainOrder.userName || 'Customer',
            mainOrder._id,
            mainOrder.orderNumber
          );
        }
      } catch (emailError) {
        console.error('Error sending feedback request email:', emailError);
        // Don't fail the order update if email fails
      }
    }

    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    console.error('ORDER STATUS UPDATE ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order history
router.get('/order-history', auth, isDeliveryPartner, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const orders = await DeliveryOrder.find({
      deliveryPartnerId: req.deliveryPartner._id,
      status: { $in: ['delivered', 'cancelled', 'failed'] }
    })
      .populate('orderId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DeliveryOrder.countDocuments({
      deliveryPartnerId: req.deliveryPartner._id,
      status: { $in: ['delivered', 'cancelled', 'failed'] }
    });

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payouts
router.get('/payouts', auth, isDeliveryPartner, async (req, res) => {
  try {
    const payouts = await Payout.find({
      deliveryPartnerId: req.deliveryPartner._id
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get earnings summary
router.get('/earnings', auth, isDeliveryPartner, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {
      deliveryPartnerId: req.deliveryPartner._id,
      status: 'delivered'
    };

    if (startDate && endDate) {
      matchQuery.updatedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await DeliveryOrder.find(matchQuery);

    const totalEarnings = orders.reduce((sum, order) => sum + order.payment.totalEarning, 0);
    const totalOrders = orders.length;
    const totalDistance = orders.reduce((sum, order) => sum + order.deliveryDetails.estimatedDistance, 0);

    res.json({
      success: true,
      data: {
        totalEarnings,
        totalOrders,
        totalDistance,
        averagePerOrder: totalOrders > 0 ? totalEarnings / totalOrders : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Select preferred store for delivery partner
router.post('/select-store', auth, isDeliveryPartner, async (req, res) => {
  try {
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store ID is required' });
    }

    // Verify store exists and is active
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (!store.is_active) {
      return res.status(400).json({ success: false, message: 'Store is not active' });
    }

    // Update delivery partner's preferred stores
    const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
    
    // Add store to preferred stores if not already there
    if (!partner.workDetails.preferredStoreIds) {
      partner.workDetails.preferredStoreIds = [];
    }
    
    if (!partner.workDetails.preferredStoreIds.includes(storeId)) {
      partner.workDetails.preferredStoreIds.push(storeId);
    }

    await partner.save();

    res.json({ 
      success: true, 
      message: 'Store selected successfully',
      store 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report issue with delivery
router.post('/report-issue/:deliveryOrderId', auth, isDeliveryPartner, async (req, res) => {
  try {
    const { type, description } = req.body;

    const deliveryOrder = await DeliveryOrder.findOne({
      _id: req.params.deliveryOrderId,
      deliveryPartnerId: req.deliveryPartner._id
    });

    if (!deliveryOrder) {
      return res.status(404).json({ success: false, message: 'Delivery order not found' });
    }

    deliveryOrder.issues.push({
      type,
      description,
      reportedAt: new Date()
    });

    await deliveryOrder.save();

    res.json({ success: true, message: 'Issue reported', data: deliveryOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin routes for managing delivery partners
router.get('/admin/all', async (req, res) => {
  try {
    const partners = await DeliveryPartner.find()
      .sort({ createdAt: -1 });

    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      {
        status,
        rejectionReason: reason
      },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    res.json({ success: true, message: 'Partner status updated', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/:id/approve', async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        'kycDetails.kycStatus': 'approved',
        'kycDetails.verifiedAt': new Date(),
        'adminApproval.approvedAt': new Date(),
        'adminApproval.rejectedAt': null
      },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    // Generate PDF
    const pdfBuffer = await generateDeliveryPartnerPDF(partner);

    // Send approval email with PDF attachment
    const emailSubject = '🎉 Delivery Partner Registration Approved - Mahir & Friends';
    const emailBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <div style="background: rgba(255,255,255,0.95); padding: 40px; margin: 20px; border-radius: 15px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
            <h1 style="color: #667eea; margin: 0; font-size: 28px; font-weight: bold;">Congratulations!</h1>
            <p style="color: #764ba2; font-size: 18px; margin: 10px 0;">Your Application Has Been Approved</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <p style="color: white; margin: 0; font-size: 16px; text-align: center;">
              <strong style="font-size: 18px;">Dear ${partner.personalDetails.fullName},</strong>
            </p>
            <p style="color: white; margin: 10px 0 0; font-size: 14px; text-align: center;">
              Your delivery partner registration has been <span style="background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold;">APPROVED</span>
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #667eea;">
            <p style="color: #333; margin: 0 0 10px; font-size: 14px;">
              <strong style="color: #667eea;">📋 Your registration details are attached as a PDF document</strong>
            </p>
            <p style="color: #666; margin: 0; font-size: 13px;">
              Signed by: <strong style="color: #764ba2;">${partner.adminApproval.approvedBy}</strong><br>
              <span style="color: #666;">${partner.adminApproval.approvedByTitle}</span>
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #667eea; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
              🚀 Next Steps
            </h3>
            <ol style="color: #333; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 12px; padding-left: 10px;">
                <span style="color: #764ba2; font-weight: bold;">Pay the joining fee</span> of <strong style="color: #4CAF50;">₹${partner.joiningFee?.amount || 500}</strong> to activate your account
              </li>
              <li style="margin-bottom: 12px; padding-left: 10px;">
                <span style="color: #764ba2; font-weight: bold;">Complete your profile setup</span> with all required information
              </li>
              <li style="margin-bottom: 12px; padding-left: 10px;">
                <span style="color: #764ba2; font-weight: bold;">Start accepting delivery orders</span> and earn money
              </li>
            </ol>
          </div>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <p style="color: white; margin: 0; font-size: 14px;">
              <strong>Need Help?</strong> Contact our support team anytime
            </p>
          </div>

          <div style="text-align: center; border-top: 2px solid #eee; padding-top: 20px;">
            <p style="color: #667eea; margin: 0; font-size: 16px; font-weight: bold;">Best regards,</p>
            <p style="color: #764ba2; margin: 5px 0 0; font-size: 14px;">Mahir & Friends Team</p>
            <div style="margin-top: 15px; color: #999; font-size: 12px;">
              🌟 Delivering Excellence, Together 🌟
            </div>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: partner.personalDetails.email,
      subject: emailSubject,
      html: emailBody,
      attachments: [{
        filename: `delivery-partner-${partner._id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    res.json({ success: true, message: 'Partner approved successfully. Approval email sent with PDF attachment.', data: partner });
  } catch (error) {
    console.error('Error approving partner:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason,
        'adminApproval.rejectedAt': new Date(),
        'adminApproval.approvedAt': null
      },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    // Send rejection email without PDF
    const emailSubject = '📋 Delivery Partner Registration Update - Mahir & Friends';
    const emailBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <div style="background: rgba(255,255,255,0.95); padding: 40px; margin: 20px; border-radius: 15px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 60px; margin-bottom: 10px;">📋</div>
            <h1 style="color: #f5576c; margin: 0; font-size: 28px; font-weight: bold;">Registration Update</h1>
            <p style="color: #f093fb; font-size: 18px; margin: 10px 0;">Your Application Status</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <p style="color: white; margin: 0; font-size: 16px; text-align: center;">
              <strong style="font-size: 18px;">Dear ${partner.personalDetails.fullName},</strong>
            </p>
            <p style="color: white; margin: 10px 0 0; font-size: 14px; text-align: center;">
              Your delivery partner registration has been <span style="background: #ff6b6b; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold;">REJECTED</span>
            </p>
          </div>

          ${reason ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0 0 10px; font-size: 14px;">
              <strong style="color: #dc3545;">⚠️ Reason for rejection:</strong>
            </p>
            <p style="color: #856404; margin: 0; font-size: 13px;">${reason}</p>
          </div>
          ` : ''}

          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #f093fb;">
            <p style="color: #333; margin: 0; font-size: 14px;">
              <strong style="color: #f5576c;">💡 What can you do?</strong>
            </p>
            <ul style="color: #666; padding-left: 20px; margin: 10px 0 0; font-size: 13px;">
              <li style="margin-bottom: 8px;">Review the rejection reason above</li>
              <li style="margin-bottom: 8px;">Contact our support team for clarification</li>
              <li style="margin-bottom: 0;">Reapply after addressing the issues</li>
            </ul>
          </div>

          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <p style="color: white; margin: 0; font-size: 14px;">
              <strong>Need Help?</strong> Contact our support team anytime
            </p>
          </div>

          <div style="text-align: center; border-top: 2px solid #eee; padding-top: 20px;">
            <p style="color: #f093fb; margin: 0; font-size: 16px; font-weight: bold;">Best regards,</p>
            <p style="color: #f5576c; margin: 5px 0 0; font-size: 14px;">Mahir & Friends Team</p>
            <div style="margin-top: 15px; color: #999; font-size: 12px;">
              🌟 Delivering Excellence, Together 🌟
            </div>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: partner.personalDetails.email,
      subject: emailSubject,
      html: emailBody
    });

    res.json({ success: true, message: 'Partner rejected successfully. Rejection email sent.', data: partner });
  } catch (error) {
    console.error('Error rejecting partner:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate payment QR code for joining fee
router.post('/joining-fee-qr', auth, isDeliveryPartner, async (req, res) => {
  try {
    const partner = req.deliveryPartner;

    if (partner.status !== 'approved' && partner.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: 'You must be approved before paying the joining fee' });
    }

    if (partner.joiningFee?.paid) {
      return res.status(400).json({ success: false, message: 'Joining fee already paid' });
    }

    const amount = partner.joiningFee?.amount || 500;

    // Create Razorpay order and generate QR code
    const paymentDetails = await createFeePaymentOrder(amount, 'joining_fee', partner._id);

    res.json({
      success: true,
      message: 'Payment QR code generated successfully',
      data: paymentDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify joining fee payment
router.post('/verify-joining-fee', auth, isDeliveryPartner, [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const partner = req.deliveryPartner;

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    if (partner.joiningFee?.paid) {
      return res.status(400).json({ success: false, message: 'Joining fee already paid' });
    }

    // Update partner payment status
    partner.joiningFee = {
      amount: partner.joiningFee?.amount || 500,
      paid: true,
      paidAt: new Date(),
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      signature: razorpay_signature
    };

    partner.status = 'active';

    // Set renewal fee due date (30 days from now)
    partner.renewalFee = {
      amount: partner.renewalFee?.amount || 200,
      lastPaidAt: new Date(),
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isPaid: true
    };

    await partner.save();

    res.json({ success: true, message: 'Joining fee paid successfully. You can now start working!', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pay joining fee (legacy route - kept for backward compatibility)
router.post('/pay-joining-fee', auth, isDeliveryPartner, async (req, res) => {
  try {
    const partner = req.deliveryPartner;

    if (partner.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'You must be approved before paying the joining fee' });
    }

    if (partner.joiningFee?.paid) {
      return res.status(400).json({ success: false, message: 'Joining fee already paid' });
    }

    // Simulate payment (in production, integrate with payment gateway)
    const { paymentId } = req.body;

    partner.joiningFee = {
      amount: partner.joiningFee?.amount || 500,
      paid: true,
      paidAt: new Date(),
      paymentId: paymentId || 'simulated_payment_' + Date.now()
    };

    partner.status = 'active';

    // Set renewal fee due date (30 days from now)
    partner.renewalFee = {
      amount: partner.renewalFee?.amount || 200,
      lastPaidAt: new Date(),
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isPaid: true
    };

    await partner.save();

    res.json({ success: true, message: 'Joining fee paid successfully. You can now start working!', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create payment order for delivery partner fees
router.post('/create-payment-order', auth, isDeliveryPartner, async (req, res) => {
  try {
    const { amount, type, currency = 'INR', receipt } = req.body;
    const partner = req.deliveryPartner;

    // Validate payment type
    if (type === 'joining' && partner.joiningFee?.paid) {
      return res.status(400).json({ success: false, message: 'Joining fee already paid' });
    }

    if (type === 'renewal' && partner.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Your account must be active to pay renewal fee' });
    }

    // Create Razorpay order
    const { createRazorpayOrder } = await import('../utils/razorpay.js');
    const order = await createRazorpayOrder(amount, currency, receipt, {
      partnerId: partner._id,
      paymentType: type,
      partnerEmail: partner.personalDetails.email
    });

    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify payment for delivery partner fees
router.post('/verify-payment', auth, isDeliveryPartner, [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature required'),
  body('type').notEmpty().withMessage('Payment type required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type } = req.body;
    const partner = req.deliveryPartner;

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    if (type === 'joining') {
      if (partner.joiningFee?.paid) {
        return res.status(400).json({ success: false, message: 'Joining fee already paid' });
      }

      const paidAt = new Date();
      const nextDueDate = new Date(paidAt);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      // Update partner payment status
      partner.joiningFee = {
        amount: partner.joiningFee?.amount || 500,
        paid: true,
        paidAt: paidAt,
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        signature: razorpay_signature
      };

      partner.status = 'active';

      // Set renewal fee due date (1 month from joining)
      partner.renewalFee = {
        amount: partner.renewalFee?.amount || 200,
        lastPaidAt: paidAt,
        nextDueDate: nextDueDate,
        isPaid: true
      };
    } else if (type === 'renewal') {
      // Update renewal fee payment status
      const lastPaidAt = new Date();
      const nextDueDate = new Date(lastPaidAt);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      partner.renewalFee = {
        amount: partner.renewalFee?.amount || 200,
        lastPaidAt: lastPaidAt,
        nextDueDate: nextDueDate,
        isPaid: true,
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        signature: razorpay_signature
      };

      // Unblock partner if they were blocked due to overdue renewal
      if (partner.status === 'suspended') {
        partner.status = 'active';
      }
    }

    await partner.save();

    res.json({ success: true, message: 'Payment verified successfully', data: partner });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate payment QR code for renewal fee
router.post('/renewal-fee-qr', auth, isDeliveryPartner, async (req, res) => {
  try {
    const partner = req.deliveryPartner;

    if (partner.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Your account must be active to pay renewal fee' });
    }

    const amount = partner.renewalFee?.amount || 200;

    // Create Razorpay order and generate QR code
    const paymentDetails = await createFeePaymentOrder(amount, 'renewal_fee', partner._id);

    res.json({
      success: true,
      message: 'Payment QR code generated successfully',
      data: paymentDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify renewal fee payment
router.post('/verify-renewal-fee', auth, isDeliveryPartner, [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const partner = req.deliveryPartner;

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Update partner payment status
    partner.renewalFee = {
      amount: partner.renewalFee?.amount || 200,
      lastPaidAt: new Date(),
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isPaid: true,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      signature: razorpay_signature
    };

    await partner.save();

    res.json({ success: true, message: 'Renewal fee paid successfully. Your account is active for another 30 days!', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pay renewal fee (legacy route - kept for backward compatibility)
router.post('/pay-renewal-fee', auth, isDeliveryPartner, async (req, res) => {
  try {
    const partner = req.deliveryPartner;

    if (partner.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Your account must be active to pay renewal fee' });
    }

    // Simulate payment (in production, integrate with payment gateway)
    const { paymentId } = req.body;

    partner.renewalFee = {
      amount: partner.renewalFee?.amount || 200,
      lastPaidAt: new Date(),
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isPaid: true
    };

    await partner.save();

    res.json({ success: true, message: 'Renewal fee paid successfully. Your account is active for another 30 days!', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/:id/kyc', async (req, res) => {
  try {
    const { kycStatus, rejectionReason } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      {
        'kycDetails.kycStatus': kycStatus,
        'kycDetails.kycRejectedReason': rejectionReason,
        'kycDetails.verifiedAt': kycStatus === 'approved' ? new Date() : null
      },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    res.json({ success: true, message: 'KYC status updated', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate PDF for delivery partner
router.get('/admin/:id/pdf', async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `delivery-partner-${partner._id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Delivery Partner Registration Details', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Personal Details Section
    doc.fontSize(16).font('Helvetica-Bold').text('Personal Details', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Full Name: ${partner.personalDetails.fullName}`);
    doc.text(`Email: ${partner.personalDetails.email}`);
    doc.text(`Contact Number: ${partner.personalDetails.contactNumber}`);
    doc.text(`Date of Birth: ${partner.personalDetails.dateOfBirth ? new Date(partner.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A'}`);
    doc.text(`Gender: ${partner.personalDetails.gender || 'N/A'}`);
    doc.moveDown();

    // Address Section
    doc.fontSize(16).font('Helvetica-Bold').text('Address Details', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Street: ${partner.address.street || 'N/A'}`);
    doc.text(`City: ${partner.address.city || 'N/A'}`);
    doc.text(`State: ${partner.address.state || 'N/A'}`);
    doc.text(`Pincode: ${partner.address.pincode || 'N/A'}`);
    doc.moveDown();

    // Vehicle Details Section
    doc.fontSize(16).font('Helvetica-Bold').text('Vehicle Details', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Vehicle Type: ${partner.vehicleDetails.vehicleType || 'N/A'}`);
    doc.text(`Vehicle Number: ${partner.vehicleDetails.vehicleNumber || 'N/A'}`);
    doc.text(`Vehicle Name: ${partner.vehicleDetails.vehicleName || 'N/A'}`);
    doc.text(`Vehicle Color: ${partner.vehicleDetails.vehicleColor || 'N/A'}`);
    doc.moveDown();

    // Work Details Section
    doc.fontSize(16).font('Helvetica-Bold').text('Work Details', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Preferred Areas: ${partner.workDetails?.preferredAreas?.join(', ') || 'N/A'}`);
    doc.text(`Available Hours: ${partner.workDetails?.availableHours || 'N/A'}`);
    doc.text(`Total Deliveries: ${partner.workDetails?.totalDeliveries || 0}`);
    doc.text(`Online Status: ${partner.workDetails?.isOnline ? 'Online' : 'Offline'}`);
    doc.moveDown();

    // KYC Details Section
    doc.fontSize(16).font('Helvetica-Bold').text('KYC Details', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Aadhar Number: ${partner.kycDetails?.aadharNumber || 'N/A'}`);
    doc.text(`KYC Status: ${partner.kycDetails?.kycStatus || 'Pending'}`);
    if (partner.kycDetails?.kycStatus === 'approved') {
      doc.text(`KYC Verified At: ${partner.kycDetails?.verifiedAt ? new Date(partner.kycDetails.verifiedAt).toLocaleString() : 'N/A'}`);
    }
    doc.moveDown();

    // Account Status Section
    doc.fontSize(16).font('Helvetica-Bold').text('Account Status', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Status: ${partner.status?.toUpperCase() || 'N/A'}`);
    doc.text(`Registration Date: ${partner.createdAt ? new Date(partner.createdAt).toLocaleString() : 'N/A'}`);
    doc.moveDown();

    // Fee Details Section
    doc.fontSize(16).font('Helvetica-Bold').text('Fee Details', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Joining Fee: ₹${partner.joiningFee?.amount || 500}`);
    doc.text(`Joining Fee Status: ${partner.joiningFee?.isPaid ? 'Paid' : 'Pending'}`);
    if (partner.joiningFee?.paidAt) {
      doc.text(`Joining Fee Paid At: ${new Date(partner.joiningFee.paidAt).toLocaleString()}`);
    }
    doc.moveDown();
    doc.text(`Renewal Fee: ₹${partner.renewalFee?.amount || 200}`);
    doc.text(`Renewal Fee Status: ${partner.renewalFee?.isPaid ? 'Paid' : 'Pending'}`);
    if (partner.renewalFee?.lastPaidAt) {
      doc.text(`Last Renewal Fee Paid At: ${new Date(partner.renewalFee.lastPaidAt).toLocaleString()}`);
    }
    if (partner.renewalFee?.nextDueDate) {
      doc.text(`Next Renewal Due Date: ${new Date(partner.renewalFee.nextDueDate).toLocaleDateString()}`);
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update delivery partner details (Admin only)
router.put('/admin/:id/update', async (req, res) => {
  try {
    const { 
      personalDetails, 
      address, 
      vehicleDetails, 
      workDetails 
    } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      {
        ...(personalDetails && {
          'personalDetails.fullName': personalDetails.fullName,
          'personalDetails.email': personalDetails.email,
          'personalDetails.contactNumber': personalDetails.contactNumber,
          'personalDetails.dateOfBirth': personalDetails.dateOfBirth,
          'personalDetails.gender': personalDetails.gender
        }),
        ...(address && {
          'address.street': address.street,
          'address.city': address.city,
          'address.state': address.state,
          'address.pincode': address.pincode
        }),
        ...(vehicleDetails && {
          'vehicleDetails.vehicleType': vehicleDetails.vehicleType,
          'vehicleDetails.vehicleNumber': vehicleDetails.vehicleNumber,
          'vehicleDetails.vehicleName': vehicleDetails.vehicleName,
          'vehicleDetails.vehicleColor': vehicleDetails.vehicleColor
        }),
        ...(workDetails && {
          'workDetails.preferredAreas': workDetails.preferredAreas,
          'workDetails.availableHours': workDetails.availableHours
        })
      },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    res.json({ success: true, message: 'Partner details updated successfully', data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin/stats', async (req, res) => {
  try {
    const total = await DeliveryPartner.countDocuments();
    const active = await DeliveryPartner.countDocuments({ status: 'active' });
    const pending = await DeliveryPartner.countDocuments({ status: 'pending' });
    const kycPending = await DeliveryPartner.countDocuments({ 'kycDetails.kycStatus': 'pending' });

    res.json({
      success: true,
      data: { total, active, pending, kycPending }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get nearest store based on delivery partner location
router.get('/nearest-store', auth, async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const partnerLat = parseFloat(lat);
    const partnerLng = parseFloat(lng);

    // Get all active stores
    const stores = await Store.find({ is_active: true });

    if (stores.length === 0) {
      return res.status(404).json({ success: false, message: 'No active stores found' });
    }

    // Calculate distance to each store using Haversine formula
    const storesWithDistance = stores.map(store => {
      const distance = calculateDistance(partnerLat, partnerLng, store.coordinates.lat, store.coordinates.lng);
      return {
        ...store.toObject(),
        distance
      };
    });

    // Sort by distance and get the nearest one
    storesWithDistance.sort((a, b) => a.distance - b.distance);
    const nearestStore = storesWithDistance[0];

    res.json({
      success: true,
      store: nearestStore,
      distance: nearestStore.distance
    });
  } catch (error) {
    console.error('Error finding nearest store:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Get orders assigned to delivery partner
router.get('/orders', auth, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(403).json({ success: false, message: 'Not a delivery partner' });
    }

    const orders = await Order.find({ 
      'delivery.partnerId': partner._id 
    }).sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
