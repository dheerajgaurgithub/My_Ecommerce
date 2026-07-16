import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image_url: {
    type: String,
    default: null
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  sort_order: {
    type: Number,
    default: 0
  }
});

categorySchema.index({ parent_id: 1 });

export default mongoose.model('Category', categorySchema);
