import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_name: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    default: null
  },
  body: {
    type: String,
    default: null
  },
  photos: {
    type: [String],
    default: []
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  helpful_count: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reviewSchema.index({ product_id: 1 });
reviewSchema.index({ user_id: 1 });

export default mongoose.model('Review', reviewSchema);
