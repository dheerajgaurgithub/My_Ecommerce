import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  size: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: null
  },
  gift_wrap: {
    type: Boolean,
    default: false
  },
  saved_for_later: {
    type: Boolean,
    default: false
  }
});

cartSchema.index({ user_id: 1, product_id: 1, size: 1, color: 1 });

export default mongoose.model('Cart', cartSchema);
