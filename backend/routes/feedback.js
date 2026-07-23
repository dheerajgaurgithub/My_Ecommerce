import express from 'express';
import Feedback from '../models/Feedback.js';
import Order from '../models/Order.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import { body, validationResult } from 'express-validator';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Submit feedback (public access via unique token)
router.post('/submit', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('productQuality.rating').isInt({ min: 1, max: 5 }).withMessage('Product quality rating must be 1-5'),
  body('deliveryExperience.rating').isInt({ min: 1, max: 5 }).withMessage('Delivery experience rating must be 1-5'),
  body('overallService.rating').isInt({ min: 1, max: 5 }).withMessage('Overall service rating must be 1-5'),
  body('wouldRecommend').isBoolean().withMessage('Would recommend is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      orderId,
      productQuality,
      deliveryExperience,
      overallService,
      queries,
      suggestions,
      wouldRecommend
    } = req.body;

    // Verify order exists and is delivered
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Feedback can only be submitted for delivered orders' });
    }

    // Check if feedback already exists for this order
    const existingFeedback = await Feedback.findOne({ orderId });
    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this order' });
    }

    // Create feedback
    const feedback = new Feedback({
      orderId,
      userId: order.userId,
      userEmail: order.userEmail,
      userName: order.userName || 'Customer',
      productQuality,
      deliveryExperience,
      overallService,
      queries: queries || '',
      suggestions: suggestions || '',
      wouldRecommend
    });

    await feedback.save();

    // Update delivery partner rating based on delivery experience
    if (order.delivery && order.delivery.partnerId) {
      try {
        const partner = await DeliveryPartner.findById(order.delivery.partnerId);
        if (partner) {
          // Get all feedback for orders delivered by this partner
          const partnerOrders = await Order.find({
            'delivery.partnerId': partner._id,
            status: 'delivered'
          }).select('_id');
          
          const orderIds = partnerOrders.map(o => o._id);
          const allFeedback = await Feedback.find({
            orderId: { $in: orderIds }
          });
          
          // Calculate average delivery experience rating
          if (allFeedback.length > 0) {
            const totalRating = allFeedback.reduce((sum, f) => sum + f.deliveryExperience.rating, 0);
            const averageRating = totalRating / allFeedback.length;
            
            // Update partner rating
            partner.workDetails.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
            await partner.save();
          }
        }
      } catch (ratingError) {
        console.error('Error updating partner rating:', ratingError);
        // Don't fail the feedback submission if rating update fails
      }
    }

    res.json({ 
      success: true, 
      message: 'Thank you for your feedback! We appreciate your input.',
      data: feedback
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all feedback (Admin only)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const feedback = await Feedback.find(filter)
      .populate('orderId', 'orderNumber totalAmount items')
      .populate('userId', 'name email')
      .populate('adminResponse.respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Feedback.countDocuments(filter);

    res.json({ 
      success: true, 
      data: feedback,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single feedback by ID (Admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('orderId', 'orderNumber totalAmount items shippingAddress')
      .populate('userId', 'name email phone')
      .populate('adminResponse.respondedBy', 'name email');

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update feedback status (Admin only)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.json({ success: true, data: feedback, message: 'Feedback status updated' });
  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Respond to feedback (Admin only)
router.put('/:id/respond', adminAuth, async (req, res) => {
  try {
    const { response } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        adminResponse: {
          responded: true,
          response,
          respondedAt: new Date(),
          respondedBy: req.user._id
        },
        status: 'reviewed'
      },
      { new: true }
    ).populate('adminResponse.respondedBy', 'name email');

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // Send email notification to customer about admin response
    // (You can add email sending logic here)

    res.json({ success: true, data: feedback, message: 'Response sent successfully' });
  } catch (error) {
    console.error('Respond to feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get feedback statistics (Admin only)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const total = await Feedback.countDocuments();
    const pending = await Feedback.countDocuments({ status: 'pending' });
    const reviewed = await Feedback.countDocuments({ status: 'reviewed' });
    const resolved = await Feedback.countDocuments({ status: 'resolved' });

    // Average ratings
    const avgProductQuality = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$productQuality.rating' } } }
    ]);
    const avgDeliveryExperience = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$deliveryExperience.rating' } } }
    ]);
    const avgOverallService = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$overallService.rating' } } }
    ]);

    // Recommendation rate
    const wouldRecommendCount = await Feedback.countDocuments({ wouldRecommend: true });
    const recommendationRate = total > 0 ? (wouldRecommendCount / total) * 100 : 0;

    res.json({
      success: true,
      data: {
        total,
        pending,
        reviewed,
        resolved,
        averageRatings: {
          productQuality: avgProductQuality[0]?.avgRating?.toFixed(2) || 0,
          deliveryExperience: avgDeliveryExperience[0]?.avgRating?.toFixed(2) || 0,
          overallService: avgOverallService[0]?.avgRating?.toFixed(2) || 0
        },
        recommendationRate: recommendationRate.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
