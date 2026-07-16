import mongoose from 'mongoose';

const scratchCardSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prizeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize',
    required: true
  },
  uniqueToken: {
    type: String,
    required: true,
    unique: true
  },
  isScratched: {
    type: Boolean,
    default: false
  },
  scratchedAt: {
    type: Date,
    default: null
  },
  isClaimed: {
    type: Boolean,
    default: false
  },
  claimedAt: {
    type: Date,
    default: null
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  qrCode: {
    type: String,
    trim: true
  },
  collectionOTP: {
    type: String,
    trim: true
  },
  collectionOTPExpiresAt: {
    type: Date,
    default: null
  },
  pickupStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    default: null
  },
  pickupScheduledAt: {
    type: Date,
    default: null
  },
  isCollected: {
    type: Boolean,
    default: false
  },
  collectedAt: {
    type: Date,
    default: null
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  isFromReferral: {
    type: Boolean,
    default: false
  },
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    default: null
  },
  isLuckyWheel: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

scratchCardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('ScratchCard', scratchCardSchema);
