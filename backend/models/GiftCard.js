import mongoose from 'mongoose';

const giftCardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  denomination: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  image_url: {
    type: String,
    default: null
  },
  is_published: {
    type: Boolean,
    default: true
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('GiftCard', giftCardSchema);
