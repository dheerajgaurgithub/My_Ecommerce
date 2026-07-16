import mongoose from 'mongoose';

const deliveryLocationSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true
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
  is_available: {
    type: Boolean,
    default: true
  },
  is_free_delivery: {
    type: Boolean,
    default: false
  },
  delivery_charge: {
    type: Number,
    default: 99
  },
  estimated_days: {
    type: Number,
    default: 5
  },
  is_express: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('DeliveryLocation', deliveryLocationSchema);
