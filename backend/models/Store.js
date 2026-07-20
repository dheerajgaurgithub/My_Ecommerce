import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    area: {
      type: String,
      default: null
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
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  phone: {
    type: String,
    default: null
  },
  googleMapsLink: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  operating_hours: {
    type: String,
    default: '9:00 AM - 9:00 PM'
  },
  landmark: {
    type: String,
    default: null
  },
  serviceRadius: {
    type: Number,
    default: 50, // Default service radius in kilometers
    description: 'Maximum distance from store for delivery service'
  }
});

// Virtual to get full address
storeSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.address.street,
    this.address.area,
    this.address.city,
    this.address.district,
    this.address.state,
    this.address.pincode,
    this.address.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Ensure virtuals are included in JSON
storeSchema.set('toJSON', { virtuals: true });
storeSchema.set('toObject', { virtuals: true });

export default mongoose.model('Store', storeSchema);
