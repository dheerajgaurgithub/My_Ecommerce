import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    default: null
  },
  discount_type: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discount_value: {
    type: Number,
    required: true
  },
  min_order: {
    type: Number,
    default: 0
  },
  max_discount: {
    type: Number,
    default: null
  },
  usage_limit: {
    type: Number,
    default: null
  },
  used_count: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  valid_from: {
    type: Date,
    default: null
  },
  valid_until: {
    type: Date,
    default: null
  }
});

export default mongoose.model('Coupon', couponSchema);
