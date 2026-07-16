import mongoose from 'mongoose';

const deliveryOrderSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
    required: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  pickupDetails: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    contactNumber: {
      type: String,
      required: true
    },
    pickupOTP: {
      type: String,
      required: true
    }
  },
  deliveryDetails: {
    deliveryOTP: {
      type: String,
      required: true
    },
    estimatedDistance: {
      type: Number,
      required: true
    },
    estimatedDuration: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['assigned', 'accepted', 'reached_store', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'],
    default: 'assigned'
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      latitude: Number,
      longitude: Number
    },
    notes: String
  }],
  payment: {
    deliveryFee: {
      type: Number,
      required: true
    },
    distanceFee: {
      type: Number,
      required: true
    },
    bonus: {
      type: Number,
      default: 0
    },
    totalEarning: {
      type: Number,
      required: true
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'processed', 'paid'],
      default: 'pending'
    },
    payoutDate: {
      type: Date
    }
  },
  issues: [{
    type: {
      type: String,
      enum: ['customer_not_available', 'wrong_address', 'payment_issue', 'product_issue', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  rating: {
    customerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    customerFeedback: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
deliveryOrderSchema.index({ orderId: 1 });
deliveryOrderSchema.index({ deliveryPartnerId: 1 });
deliveryOrderSchema.index({ storeId: 1 });
deliveryOrderSchema.index({ status: 1 });
deliveryOrderSchema.index({ 'payment.payoutStatus': 1 });
deliveryOrderSchema.index({ createdAt: -1 });

const DeliveryOrder = mongoose.model('DeliveryOrder', deliveryOrderSchema);

export default DeliveryOrder;
