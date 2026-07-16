import mongoose from 'mongoose';

const comboPackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  price: {
    type: Number,
    required: true
  },
  compare_at_price: {
    type: Number,
    default: null
  },
  product_ids: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Product',
    default: []
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

export default mongoose.model('ComboPack', comboPackSchema);
