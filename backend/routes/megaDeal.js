import express from 'express';
import crypto from 'crypto';
import Campaign from '../models/Campaign.js';
import Prize from '../models/Prize.js';
import ScratchCard from '../models/ScratchCard.js';
import LuckyWheel from '../models/LuckyWheel.js';
import Referral from '../models/Referral.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';

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
router.get('/scratch-cards', auth, async (req, res) => {
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
router.post('/scratch-card/generate', auth, async (req, res) => {
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
router.post('/scratch-card/scratch', auth, async (req, res) => {
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
router.post('/scratch-card/claim', auth, async (req, res) => {
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
router.post('/scratch-card/generate-otp', auth, async (req, res) => {
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
router.post('/admin/campaign', auth, adminAuth, async (req, res) => {
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
router.put('/admin/campaign/:id', auth, adminAuth, async (req, res) => {
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
router.get('/admin/campaigns', auth, adminAuth, async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create prize
router.post('/admin/prize', auth, adminAuth, async (req, res) => {
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
router.put('/admin/prize/:id', auth, adminAuth, async (req, res) => {
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
router.get('/admin/campaign/:campaignId/prizes', auth, adminAuth, async (req, res) => {
  try {
    const prizes = await Prize.find({ campaignId: req.params.campaignId });
    res.json({ success: true, prizes });
  } catch (error) {
    console.error('Error fetching prizes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all scratch cards (admin)
router.get('/admin/scratch-cards', auth, adminAuth, async (req, res) => {
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
router.post('/admin/scratch-card/:id/collect', auth, adminAuth, async (req, res) => {
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
router.post('/admin/scratch-card/:id/verify-otp', auth, adminAuth, async (req, res) => {
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

// ==================== LUCKY WHEEL ROUTES ====================

// Generate lucky wheel for order (called when order is delivered and amount >= threshold)
router.post('/lucky-wheel/generate', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Check if lucky wheel already exists for this order
    const existingWheel = await LuckyWheel.findOne({ orderId });
    if (existingWheel) {
      return res.json({ success: false, message: 'Lucky wheel already generated for this order' });
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
      return res.json({ success: false, message: 'Order must be delivered to unlock lucky wheel' });
    }

    // Get active campaign
    const campaign = await Campaign.findOne({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      enableLuckyWheel: true
    });

    if (!campaign) {
      return res.json({ success: false, message: 'No active campaign with lucky wheel enabled' });
    }

    // Check minimum purchase amount for lucky wheel
    if (order.total < campaign.luckyWheelThreshold) {
      return res.json({ 
        success: false, 
        message: `Minimum purchase of ₹${campaign.luckyWheelThreshold} required for lucky wheel` 
      });
    }

    // Get lucky wheel prizes (special prizes for wheel)
    const prizes = await Prize.find({ 
      campaignId: campaign._id,
      inventory: { $gt: 0 }
    });

    if (prizes.length === 0) {
      return res.status(500).json({ success: false, message: 'No prizes available for lucky wheel' });
    }

    // Generate wheel segments with colors
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C00', '#98D8C8'];
    const wheelSegments = prizes.map((prize, index) => ({
      prizeId: prize._id,
      probability: prize.probability,
      color: colors[index % colors.length]
    }));

    // Generate unique token
    const uniqueToken = 'LW' + crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Check if token already exists
    const tokenExists = await LuckyWheel.findOne({ uniqueToken });
    if (tokenExists) {
      return res.status(500).json({ success: false, message: 'Token generation failed, please try again' });
    }

    // Create lucky wheel
    const luckyWheel = new LuckyWheel({
      campaignId: campaign._id,
      orderId: order._id,
      userId: req.user._id,
      prizeId: prizes[0]._id, // Will be updated when spun
      uniqueToken,
      expiresAt: new Date(campaign.endDate),
      qrCode: `LW-${uniqueToken}`,
      collectionOTP: crypto.randomInt(100000, 999999).toString(),
      wheelSegments
    });

    await luckyWheel.save();

    res.json({
      success: true,
      message: 'Lucky wheel generated successfully',
      luckyWheel: {
        id: luckyWheel._id,
        uniqueToken: luckyWheel.uniqueToken,
        segments: wheelSegments
      }
    });
  } catch (error) {
    console.error('Error generating lucky wheel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's lucky wheels
router.get('/lucky-wheels', auth, async (req, res) => {
  try {
    const luckyWheels = await LuckyWheel.find({ userId: req.user._id })
      .populate('campaignId')
      .populate('prizeId')
      .populate('orderId')
      .sort({ createdAt: -1 });

    res.json({ success: true, luckyWheels });
  } catch (error) {
    console.error('Error fetching lucky wheels:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Spin the wheel
router.post('/lucky-wheel/spin', auth, async (req, res) => {
  try {
    const { luckyWheelId } = req.body;

    const luckyWheel = await LuckyWheel.findById(luckyWheelId)
      .populate('campaignId')
      .populate('wheelSegments.prizeId');

    if (!luckyWheel) {
      return res.status(404).json({ success: false, message: 'Lucky wheel not found' });
    }

    // Verify ownership
    if (luckyWheel.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already spun
    if (luckyWheel.isSpun) {
      return res.json({ success: false, message: 'Wheel already spun' });
    }

    // Check if expired
    if (luckyWheel.isExpired || new Date() > luckyWheel.expiresAt) {
      await LuckyWheel.findByIdAndUpdate(luckyWheelId, { isExpired: true });
      return res.json({ success: false, message: 'Lucky wheel expired' });
    }

    // Select prize based on probability
    const totalProbability = luckyWheel.wheelSegments.reduce((sum, segment) => sum + segment.probability, 0);
    const random = Math.random() * totalProbability;
    
    let cumulativeProbability = 0;
    let landedSegment = 0;
    let selectedPrize = null;

    for (let i = 0; i < luckyWheel.wheelSegments.length; i++) {
      cumulativeProbability += luckyWheel.wheelSegments[i].probability;
      if (random <= cumulativeProbability) {
        const prize = await Prize.findById(luckyWheel.wheelSegments[i].prizeId);
        if (prize && prize.inventory > prize.used) {
          selectedPrize = prize;
          landedSegment = i;
          break;
        }
      }
    }

    // Fallback to first prize if none selected
    if (!selectedPrize) {
      selectedPrize = await Prize.findById(luckyWheel.wheelSegments[0].prizeId);
      landedSegment = 0;
    }

    // Update lucky wheel
    await LuckyWheel.findByIdAndUpdate(luckyWheelId, {
      isSpun: true,
      spunAt: new Date(),
      prizeId: selectedPrize._id,
      landedSegment
    });

    // Update prize usage
    await Prize.findByIdAndUpdate(selectedPrize._id, {
      $inc: { used: 1 }
    });

    res.json({
      success: true,
      prize: selectedPrize,
      landedSegment,
      luckyWheel: {
        id: luckyWheel._id,
        uniqueToken: luckyWheel.uniqueToken,
        qrCode: luckyWheel.qrCode,
        expiresAt: luckyWheel.expiresAt
      }
    });
  } catch (error) {
    console.error('Error spinning wheel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Claim lucky wheel prize
router.post('/lucky-wheel/claim', auth, async (req, res) => {
  try {
    const { luckyWheelId, pickupStore } = req.body;

    const luckyWheel = await LuckyWheel.findById(luckyWheelId)
      .populate('prizeId');

    if (!luckyWheel) {
      return res.status(404).json({ success: false, message: 'Lucky wheel not found' });
    }

    // Verify ownership
    if (luckyWheel.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already claimed
    if (luckyWheel.isClaimed) {
      return res.json({ success: false, message: 'Prize already claimed' });
    }

    // Check if spun
    if (!luckyWheel.isSpun) {
      return res.json({ success: false, message: 'Spin the wheel first' });
    }

    // Check if expired
    if (luckyWheel.isExpired || new Date() > luckyWheel.expiresAt) {
      return res.json({ success: false, message: 'Lucky wheel expired' });
    }

    // For coupon prizes, auto-claim
    if (luckyWheel.prizeId.type === 'coupon') {
      await LuckyWheel.findByIdAndUpdate(luckyWheelId, {
        isClaimed: true,
        claimedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Coupon claimed successfully',
        couponCode: luckyWheel.prizeId.couponCode,
        couponValue: luckyWheel.prizeId.couponValue,
        couponExpiryDays: luckyWheel.prizeId.couponExpiryDays
      });
    } else {
      // For physical prizes, require store pickup
      await LuckyWheel.findByIdAndUpdate(luckyWheelId, {
        isClaimed: true,
        claimedAt: new Date(),
        pickupStore,
        pickupScheduledAt: new Date()
      });

      res.json({
        success: true,
        message: 'Prize claimed successfully. Please visit the store to collect your prize.',
        collectionOTP: luckyWheel.collectionOTP,
        qrCode: luckyWheel.qrCode
      });
    }
  } catch (error) {
    console.error('Error claiming lucky wheel prize:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate collection OTP for lucky wheel
router.post('/lucky-wheel/generate-otp', auth, async (req, res) => {
  try {
    const { luckyWheelId } = req.body;

    const luckyWheel = await LuckyWheel.findById(luckyWheelId);

    if (!luckyWheel) {
      return res.status(404).json({ success: false, message: 'Lucky wheel not found' });
    }

    // Verify ownership
    if (luckyWheel.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Generate new OTP
    const newOTP = crypto.randomInt(100000, 999999).toString();

    await LuckyWheel.findByIdAndUpdate(luckyWheelId, {
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

// ==================== REFERRAL BONUS ROUTES ====================

// Generate referral scratch card
router.post('/referral/generate', auth, async (req, res) => {
  try {
    const { referralId } = req.body;

    // Get referral
    const referral = await Referral.findById(referralId);
    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    // Check if referral belongs to user
    if (referral.referrerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already rewarded
    if (referral.isRewardClaimed) {
      return res.json({ success: false, message: 'Referral reward already claimed' });
    }

    // Get active campaign
    const campaign = await Campaign.findOne({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      enableReferralBonus: true
    });

    if (!campaign) {
      return res.json({ success: false, message: 'No active campaign with referral bonus enabled' });
    }

    // Select prize (coupon for referral)
    const prize = await Prize.findOne({ 
      campaignId: campaign._id,
      type: 'coupon',
      couponValue: campaign.referralBonusAmount
    });

    if (!prize) {
      return res.status(500).json({ success: false, message: 'No referral prize available' });
    }

    // Generate unique token
    const uniqueToken = 'RF' + crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Create scratch card
    const scratchCard = new ScratchCard({
      campaignId: campaign._id,
      orderId: null,
      userId: req.user._id,
      prizeId: prize._id,
      uniqueToken,
      expiresAt: new Date(campaign.endDate),
      qrCode: `RF-${uniqueToken}`,
      isFromReferral: true,
      referralId: referral._id
    });

    await scratchCard.save();

    // Update referral
    await Referral.findByIdAndUpdate(referralId, {
      isRewardClaimed: true,
      rewardClaimedAt: new Date()
    });

    // Update prize usage
    await Prize.findByIdAndUpdate(prize._id, {
      $inc: { used: 1 }
    });

    res.json({
      success: true,
      message: 'Referral scratch card generated successfully',
      scratchCard: {
        id: scratchCard._id,
        uniqueToken: scratchCard.uniqueToken
      }
    });
  } catch (error) {
    console.error('Error generating referral scratch card:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DAILY FLASH PRIZES ROUTES ====================

// Get daily flash prizes
router.get('/daily-flash-prizes', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      enableDailyFlashPrizes: true
    });

    if (!campaign) {
      return res.json({ success: false, message: 'No active campaign with daily flash prizes' });
    }

    const prizes = await Prize.find({ 
      campaignId: campaign._id,
      isDailyFlash: true
    });

    res.json({ 
      success: true, 
      prizes,
      flashTime: campaign.dailyFlashTime
    });
  } catch (error) {
    console.error('Error fetching daily flash prizes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset daily flash prizes (admin - called daily)
router.post('/admin/daily-flash/reset', auth, adminAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      isActive: true,
      enableDailyFlashPrizes: true
    });

    if (!campaign) {
      return res.json({ success: false, message: 'No active campaign with daily flash prizes' });
    }

    // Reset daily flash usage
    await Prize.updateMany(
      { campaignId: campaign._id, isDailyFlash: true },
      { dailyFlashUsed: 0 }
    );

    res.json({ success: true, message: 'Daily flash prizes reset successfully' });
  } catch (error) {
    console.error('Error resetting daily flash prizes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ADMIN BULK SCRATCH CARD GENERATION ====================

// Generate bulk scratch cards for a campaign
router.post('/admin/generate-scratch-cards', auth, adminAuth, async (req, res) => {
  try {
    const { campaignId, scratchCards } = req.body; // scratchCards: [{ prizeId, quantity }]
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const generatedCards = [];
    
    for (const item of scratchCards) {
      const prize = await Prize.findById(item.prizeId);
      if (!prize) {
        continue;
      }

      for (let i = 0; i < item.quantity; i++) {
        let uniqueToken = 'MF' + crypto.randomBytes(3).toString('hex').toUpperCase();
        
        // Ensure unique token
        let tokenExists = await ScratchCard.findOne({ uniqueToken });
        while (tokenExists) {
          uniqueToken = 'MF' + crypto.randomBytes(3).toString('hex').toUpperCase();
          tokenExists = await ScratchCard.findOne({ uniqueToken });
        }

        const scratchCard = new ScratchCard({
          campaignId,
          prizeId: prize._id,
          uniqueToken,
          isPreGenerated: true,
          isAssigned: false,
          expiresAt: new Date(campaign.endDate),
          qrCode: `MF-${uniqueToken}`,
          collectionOTP: crypto.randomInt(100000, 999999).toString()
        });

        await scratchCard.save();
        generatedCards.push(scratchCard);
      }
    }

    res.json({ 
      success: true, 
      message: `Generated ${generatedCards.length} scratch cards`,
      count: generatedCards.length
    });
  } catch (error) {
    console.error('Error generating scratch cards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get available (unassigned) scratch cards for a campaign
router.get('/admin/campaign/:campaignId/available-cards', auth, adminAuth, async (req, res) => {
  try {
    const availableCards = await ScratchCard.find({
      campaignId: req.params.campaignId,
      isPreGenerated: true,
      isAssigned: false
    }).populate('prizeId');

    res.json({ success: true, availableCards });
  } catch (error) {
    console.error('Error fetching available cards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assign scratch card to user after order payment
router.post('/assign-scratch-card', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if order already has scratch card
    const existingCard = await ScratchCard.findOne({ orderId });
    if (existingCard) {
      return res.json({ success: false, message: 'Scratch card already assigned for this order' });
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
        message: `Minimum purchase of ₹${campaign.minimumPurchaseAmount} required for scratch card` 
      });
    }

    // Find available pre-generated scratch card
    const availableCard = await ScratchCard.findOne({
      campaignId: campaign._id,
      isPreGenerated: true,
      isAssigned: false
    });

    if (!availableCard) {
      // Fallback: generate a new scratch card if no pre-generated cards available
      const prizes = await Prize.find({ campaignId: campaign._id, inventory: { $gt: 0 } });
      if (prizes.length === 0) {
        return res.status(500).json({ success: false, message: 'No prizes available' });
      }

      const selectedPrize = await Prize.findOne({ 
        campaignId: campaign._id,
        inventory: { $gt: 0 }
      });

      let uniqueToken = 'MF' + crypto.randomBytes(3).toString('hex').toUpperCase();
      let tokenExists = await ScratchCard.findOne({ uniqueToken });
      while (tokenExists) {
        uniqueToken = 'MF' + crypto.randomBytes(3).toString('hex').toUpperCase();
        tokenExists = await ScratchCard.findOne({ uniqueToken });
      }

      const newCard = new ScratchCard({
        campaignId: campaign._id,
        orderId: order._id,
        userId: req.user._id,
        prizeId: selectedPrize._id,
        uniqueToken,
        isPreGenerated: false,
        isAssigned: true,
        assignedAt: new Date(),
        expiresAt: new Date(campaign.endDate),
        qrCode: `MF-${uniqueToken}`,
        collectionOTP: crypto.randomInt(100000, 999999).toString()
      });

      await newCard.save();
      await Prize.findByIdAndUpdate(selectedPrize._id, { $inc: { used: 1 } });

      return res.json({
        success: true,
        message: 'Scratch card generated successfully',
        scratchCard: {
          id: newCard._id,
          uniqueToken: newCard.uniqueToken
        }
      });
    }

    // Assign pre-generated card
    await ScratchCard.findByIdAndUpdate(availableCard._id, {
      orderId: order._id,
      userId: req.user._id,
      isAssigned: true,
      assignedAt: new Date()
    });

    // Send email notification if it's a winning prize
    const prize = await Prize.findById(availableCard.prizeId);
    if (prize.type !== 'better_luck') {
      // Send email notification
      try {
        const emailService = (await import('../services/emailService.js')).default;
        const user = await User.findById(req.user._id);
        await emailService.sendScratchCardWinEmail(user.email, prize.name, availableCard.uniqueToken);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Scratch card assigned successfully',
      scratchCard: {
        id: availableCard._id,
        uniqueToken: availableCard.uniqueToken
      }
    });
  } catch (error) {
    console.error('Error assigning scratch card:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get scratch card statistics for admin
router.get('/admin/campaign/:campaignId/statistics', auth, adminAuth, async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    
    const totalCards = await ScratchCard.countDocuments({ campaignId, isPreGenerated: true });
    const assignedCards = await ScratchCard.countDocuments({ campaignId, isPreGenerated: true, isAssigned: true });
    const unassignedCards = totalCards - assignedCards;
    const scratchedCards = await ScratchCard.countDocuments({ campaignId, isPreGenerated: true, isScratched: true });
    const claimedCards = await ScratchCard.countDocuments({ campaignId, isPreGenerated: true, isClaimed: true });

    // Prize breakdown
    const prizeBreakdown = await ScratchCard.aggregate([
      { $match: { campaignId, isPreGenerated: true } },
      { $group: { _id: '$prizeId', count: { $sum: 1 } } },
      { $lookup: { from: 'prizes', localField: '_id', foreignField: '_id', as: 'prize' } }
    ]);

    res.json({
      success: true,
      statistics: {
        totalCards,
        assignedCards,
        unassignedCards,
        scratchedCards,
        claimedCards,
        prizeBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get winning scratch cards for admin verification
router.get('/admin/campaign/:campaignId/winning-cards', auth, adminAuth, async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    
    const winningCards = await ScratchCard.find({
      campaignId,
      isPreGenerated: true,
      isAssigned: true,
      isScratched: true
    })
    .populate('userId', 'name email phone')
    .populate('prizeId')
    .populate('orderId', 'order_number total')
    .sort({ scratchedAt: -1 });

    // Filter out "better luck" prizes
    const actualWinners = winningCards.filter(card => 
      card.prizeId && card.prizeId.type !== 'better_luck'
    );

    res.json({ success: true, winningCards: actualWinners });
  } catch (error) {
    console.error('Error fetching winning cards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
