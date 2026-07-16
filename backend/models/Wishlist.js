import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
});

wishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export default mongoose.model('Wishlist', wishlistSchema);
