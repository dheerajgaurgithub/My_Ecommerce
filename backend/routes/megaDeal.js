import express from 'express';
import crypto from 'crypto';
import Campaign from '../models/Campaign.js';
import Prize from '../models/Prize.js';
import ScratchCard from '../models/ScratchCard.js';
import Referral from '../models/Referral.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = express.Router();

// Helper function to generate unique token
const generateUniqueToken = () => {
  return 'MF' + crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Helper function to select prize based on probability
const selectPrize = async (campaignId, orderAmount) => {
  const prizes = await Prize.find({ campaignId, inventory: { $gt: 0 } });
  
  if (prizes.length === 0) {
    // Return "better luck" prize if no inventory
    const betterLuckPrize = await Prize.findOne({ 
      campaignId, 
      type: 'better_luck' 
    });
    return betterLuckPrize;
  }

  // Calculate total probability
  const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
  const random = Math.random() * totalProbability;
  
  let cumulativeProbability = 0;
  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    if (random <= cumulativeProbability) {
      // Check if prize has inventory
      if (prize.inventory > prize.used) {
        return prize;
      }
    }
  }
  
  // Fallback to better luck
  const betterLuckPrize = await Prize.findOne({ 
    campaignId, 
    type: 'better_luck' 
  });
  return betterLuckPrize;
};

// Get active campaign
router.get('/campaign/active', async (req, res) => {
  try {
    const now = new Date();
    const campaign = await Campaign.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('prizes');
    
    if (!campaign) {
      return res.json({ success: false, message: 'No active campaign' });
    }

    const prizes = await Prize.find({ campaignId: campaign._id });
    
    res.json({
      success: true,
      campaign: {
        ...campaign.toObject(),
        prizes
      }
    });
  } catch (error) {
    console.error('Error fetching active campaign:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's scratch cards
router.get('/scratch-cards', authMiddleware, async (req, res) => {
  try {
    const scratchCards = await ScratchCard.find({ userId: req.user._id })
      .populate('campaignId')
      .populate('prizeId')
      .populate('orderId')
      .sort({ createdAt: -1 });

    res.json({ success: true, scratchCards });
  } catch (error) {
    console.error('Error fetching scratch cards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate scratch card for order (called when order is delivered)
router.post('/scratch-card/generate', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Check if scratch card already exists for this order
    const existingCard = await ScratchCard.findOne({ orderId });
    if (existingCard) {
      return res.json({ success: false, message: 'Scratch card already generated for this order' });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.json({ success: false, message: 'Order must be delivered to unlock scratch card' });
    }

    // Get active campaign
    const campaign = await Campaign.findOne({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!campaign) {
      return res.json({ success: false, message: 'No active campaign' });
    }

    // Check minimum purchase amount
    if (order.total < campaign.minimumPurchaseAmount) {
      return res.json({ 
        success: false, 
        message: `Minimum purchase of ₹${campaign.minimumPurchaseAmount} required` 
      });
    }

    // Select prize
    const prize = await selectPrize(campaign._id, order.total);
    if (!prize) {
      return res.status(500).json({ success: false, message: 'No prizes available' });
    }

    // Generate unique token
    const uniqueToken = generateUniqueToken();
    
    // Check if token already exists (unlikely but possible)
    const tokenExists = await ScratchCard.findOne({ uniqueToken });
    if (tokenExists) {
      return res.status(500).json({ success: false, message: 'Token generation failed, please try again' });
    }

    // Create scratch card
    const scratchCard = new ScratchCard({
      campaignId: campaign._id,
      orderId: order._id,
      userId: req.user._id,
      prizeId: prize._id,
      uniqueToken,
      expiresAt: new Date(campaign.endDate),
      qrCode: `MF-${uniqueToken}`,
      collectionOTP: crypto.randomInt(100000, 999999).toString()
    });

    await scratchCard.save();

    // Update prize usage
    await Prize.findByIdAndUpdate(prize._id, {
      $inc: { used: 1 }
    });

    res.json({
      success: true,
      message: 'Scratch card generated successfully',
      scratchCard: {
        id: scratchCard._id,
        uniqueToken: scratchCard.uniqueToken
      }
    });
  } catch (error) {
    console.error('Error generating scratch card:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Scratch the card
router.post('/scratch-card/scratch', authMiddleware, async (req, res) => {
  try {
    const { scratchCardId } = req.body;

    const scratchCard = await ScratchCard.findById(scratchCardId)
      .populate('campaignId')
      .populate('prizeId');

    if (!scratchCard) {
      return res.status(404).json({ success: false, message: 'Scratch card not found' });
    }

    // Verify ownership
    if (scratchCard.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already scratched
    if (scratchCard.isScratched) {
      return res.json({ success: false, message: 'Card already scratched' });
    }

    // Check if expired
    if (scratchCard.isExpired || new Date() > scratchCard.expiresAt) {
      await ScratchCard.findByIdAndUpdate(scratchCardId, { isExpired: true });
      return res.json({ success: false, message: 'Scratch card expired' });
    }

    // Mark as scratched
    await ScratchCard.findByIdAndUpdate(scratchCardId, {
      isScratched: true,
      scratchedAt: new Date()
    });

    res.json({
      success: true,
      prize: scratchCard.prizeId,
      scratchCard: {
        id: scratchCard._id,
        uniqueToken: scratchCard.uniqueToken,
        qrCode: scratchCard.qrCode,
        expiresAt: scratchCard.expiresAt
      }
    });
  } catch (error) {
    console.error('Error scratching card:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Claim prize
router.post('/scratch-card/claim', authMiddleware, async (req, res) => {
  try {
    const { scratchCardId, pickupStore } = req.body;

    const scratchCard = await ScratchCard.findById(scratchCardId)
      .populate('prizeId');

    if (!scratchCard) {
      return res.status(404).json({ success: false, message: 'Scratch card not found' });
    }

    // Verify ownership
    if (scratchCard.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already claimed
    if (scratchCard.isClaimed) {
      return res.json({ success: false, message: 'Prize already claimed' });
    }

    // Check if scratched
    if (!scratchCard.isScratched) {
      return res.json({ success: false, message: 'Scratch the card first' });
    }

    // Check if expired
    if (scratchCard.isExpired || new Date() > scratchCard.expiresAt) {
      return res.json({ success: false, message: 'Scratch card expired' });
    }

    // For coupon prizes, auto-claim
    if (scratchCard.prizeId.type === 'coupon') {
      await ScratchCard.findByIdAndUpdate(scratchCardId, {
        isClaimed: true,
        claimedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Coupon claimed successfully',
        couponCode: scratchCard.prizeId.couponCode,
        couponValue: scratchCard.prizeId.couponValue,
        couponExpiryDays: scratchCard.prizeId.couponExpiryDays
      });
    } else {
      // For physical prizes, require store pickup
      await ScratchCard.findByIdAndUpdate(scratchCardId, {
        isClaimed: true,
        claimedAt: new Date(),
        pickupStore,
        pickupScheduledAt: new Date()
      });

      res.json({
        success: true,
        message: 'Prize claimed successfully. Please visit the store to collect your prize.',
        collectionOTP: scratchCard.collectionOTP,
        qrCode: scratchCard.qrCode
      });
    }
  } catch (error) {
    console.error('Error claiming prize:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate collection OTP for pickup
router.post('/scratch-card/generate-otp', authMiddleware, async (req, res) => {
  try {
    const { scratchCardId } = req.body;

    const scratchCard = await ScratchCard.findById(scratchCardId);

    if (!scratchCard) {
      return res.status(404).json({ success: false, message: 'Scratch card not found' });
    }

    // Verify ownership
    if (scratchCard.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Generate new OTP
    const newOTP = crypto.randomInt(100000, 999999).toString();

    await ScratchCard.findByIdAndUpdate(scratchCardId, {
      collectionOTP: newOTP,
      collectionOTPExpiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    res.json({
      success: true,
      message: 'OTP generated successfully',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get recent winners (for homepage)
router.get('/winners/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const winners = await ScratchCard.find({
      isScratched: true,
      isExpired: false,
      'prizeId.type': { $ne: 'better_luck' }
    })
      .populate('userId', 'name email')
      .populate('prizeId')
      .sort({ scratchedAt: -1 })
      .limit(limit);

    const formattedWinners = winners.map(winner => ({
      name: winner.userId.name?.split(' ')[0] || 'User',
      location: 'India',
      prize: winner.prizeId.name,
      wonAt: winner.scratchedAt
    }));

    res.json({ success: true, winners: formattedWinners });
  } catch (error) {
    console.error('Error fetching recent winners:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin routes

// Create campaign
router.post('/admin/campaign', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    
    res.json({ success: true, campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update campaign
router.put('/admin/campaign/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json({ success: true, campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all campaigns
router.get('/admin/campaigns', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create prize
router.post('/admin/prize', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const prize = new Prize(req.body);
    await prize.save();
    
    res.json({ success: true, prize });
  } catch (error) {
    console.error('Error creating prize:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update prize
router.put('/admin/prize/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const prize = await Prize.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json({ success: true, prize });
  } catch (error) {
    console.error('Error updating prize:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get prizes for campaign
router.get('/admin/campaign/:campaignId/prizes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const prizes = await Prize.find({ campaignId: req.params.campaignId });
    res.json({ success: true, prizes });
  } catch (error) {
    console.error('Error fetching prizes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all scratch cards (admin)
router.get('/admin/scratch-cards', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const scratchCards = await ScratchCard.find()
      .populate('campaignId')
      .populate('prizeId')
      .populate('userId', 'name email')
      .populate('orderId')
      .sort({ createdAt: -1 });

    res.json({ success: true, scratchCards });
  } catch (error) {
    console.error('Error fetching scratch cards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark prize as collected (admin)
router.post('/admin/scratch-card/:id/collect', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { notes } = req.body;

    await ScratchCard.findByIdAndUpdate(req.params.id, {
      isCollected: true,
      collectedAt: new Date(),
      collectedBy: req.user._id,
      notes
    });

    res.json({ success: true, message: 'Prize marked as collected' });
  } catch (error) {
    console.error('Error marking prize as collected:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify collection OTP (admin)
router.post('/admin/scratch-card/:id/verify-otp', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;

    const scratchCard = await ScratchCard.findById(req.params.id);

    if (!scratchCard) {
      return res.status(404).json({ success: false, message: 'Scratch card not found' });
    }

    if (scratchCard.collectionOTP !== otp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    if (scratchCard.collectionOTPExpiresAt && new Date() > scratchCard.collectionOTPExpiresAt) {
      return res.json({ success: false, message: 'OTP expired' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
