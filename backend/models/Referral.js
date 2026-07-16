import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  referredOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true
  },
  referrerBonusGiven: {
    type: Boolean,
    default: false
  },
  referredBonusGiven: {
    type: Boolean,
    default: false
  },
  referrerScratchCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScratchCard',
    default: null
  },
  referredScratchCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScratchCard',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  completedAt: {
    type: Date,
    default: null
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

referralSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Referral', referralSchema);
