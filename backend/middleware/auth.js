import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DeliveryPartner from '../models/DeliveryPartner.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Delivery partner specific auth middleware
export const deliveryAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const partner = await DeliveryPartner.findById(decoded.userId);

    if (!partner) {
      return res.status(401).json({ success: false, message: 'Delivery partner not found' });
    }

    req.deliveryPartner = partner;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Middleware to check if delivery partner is blocked due to overdue renewal fee
export const checkRenewalStatus = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const partner = await DeliveryPartner.findById(decoded.userId);

    if (!partner) {
      return res.status(401).json({ success: false, message: 'Delivery partner not found' });
    }

    // Check if partner is suspended due to overdue renewal
    if (partner.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended due to overdue renewal fee. Please pay the renewal fee to continue.',
        code: 'RENEWAL_OVERDUE'
      });
    }

    // Check if renewal fee is overdue (past 24-hour window)
    if (partner.joiningFee?.paid && partner.renewalFee?.nextDueDate) {
      const now = new Date();
      const nextDueDate = new Date(partner.renewalFee.nextDueDate);
      const paymentWindowEnd = new Date(nextDueDate);
      paymentWindowEnd.setHours(paymentWindowEnd.getHours() + 24);

      if (now > paymentWindowEnd) {
        // Auto-suspend partner if overdue
        partner.status = 'suspended';
        await partner.save();

        return res.status(403).json({
          success: false,
          message: 'Your account is suspended due to overdue renewal fee. Please pay the renewal fee to continue.',
          code: 'RENEWAL_OVERDUE'
        });
      }
    }

    req.deliveryPartner = partner;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
