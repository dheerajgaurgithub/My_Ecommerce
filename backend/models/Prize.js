import mongoose from 'mongoose';

const prizeSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['coupon', 'physical', 'better_luck'],
    required: true
  },
  couponValue: {
    type: Number,
    default: null
  },
  couponCode: {
    type: String,
    trim: true
  },
  couponExpiryDays: {
    type: Number,
    default: 30
  },
  inventory: {
    type: Number,
    required: true,
    default: 0
  },
  used: {
    type: Number,
    default: 0
  },
  probability: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  isGrandPrize: {
    type: Boolean,
    default: false
  },
  requiresVerification: {
    type: Boolean,
    default: true
  },
  requiresStorePickup: {
    type: Boolean,
    default: true
  },
  isDailyFlash: {
    type: Boolean,
    default: false
  },
  dailyFlashQuantity: {
    type: Number,
    default: 0
  },
  dailyFlashUsed: {
    type: Number,
    default: 0
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

prizeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Prize', prizeSchema);
