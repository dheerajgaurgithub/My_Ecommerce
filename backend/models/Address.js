import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  full_name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  address_line: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    default: null
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'India'
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  google_maps_link: {
    type: String,
    default: ''
  },
  is_default: {
    type: Boolean,
    default: false
  }
});

addressSchema.index({ user_id: 1 });

export default mongoose.model('Address', addressSchema);
