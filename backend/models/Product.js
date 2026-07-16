import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: null
  },
  brand: {
    type: String,
    default: null
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  price: {
    type: Number,
    required: true
  },
  compare_at_price: {
    type: Number,
    default: null
  },
  discount_percent: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  sku: {
    type: String,
    default: null,
    unique: true
  },
  sizes: {
    type: [String],
    default: []
  },
  colors: {
    type: [String],
    default: []
  },
  material: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unisex'],
    default: null
  },
  rating: {
    type: Number,
    default: 0
  },
  review_count: {
    type: Number,
    default: 0
  },
  images: {
    type: [String],
    default: []
  },
  video_url: {
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
  is_trending: {
    type: Boolean,
    default: false
  },
  is_bestseller: {
    type: Boolean,
    default: false
  },
  is_new_arrival: {
    type: Boolean,
    default: false
  },
  is_flash_sale: {
    type: Boolean,
    default: false
  },
  is_premium: {
    type: Boolean,
    default: false
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  tags: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ category_id: 1 });
productSchema.index({ is_published: 1 });
productSchema.index({ is_trending: 1 });
productSchema.index({ is_bestseller: 1 });
productSchema.index({ is_flash_sale: 1 });
productSchema.index({ is_premium: 1 });

export default mongoose.model('Product', productSchema);
