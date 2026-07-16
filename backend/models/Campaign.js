import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  bannerImage: {
    type: String,
    trim: true
  },
  minimumPurchaseAmount: {
    type: Number,
    required: true,
    default: 5000
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  enableLuckyWheel: {
    type: Boolean,
    default: false
  },
  luckyWheelThreshold: {
    type: Number,
    default: 10000
  },
  enableReferralBonus: {
    type: Boolean,
    default: false
  },
  referralBonusAmount: {
    type: Number,
    default: 200
  },
  showLiveWinners: {
    type: Boolean,
    default: true
  },
  enableDailyFlashPrizes: {
    type: Boolean,
    default: false
  },
  dailyFlashTime: {
    type: String,
    default: '20:00'
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

campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Campaign', campaignSchema);
