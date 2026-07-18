import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  product_name: {
    type: String,
    required: true
  },
  product_image: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
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
  }
});

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order_number: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  total: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true
  },
  shipping: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  coupon_code: {
    type: String,
    default: null
  },
  payment_method: {
    type: String,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paid_at: {
    type: Date,
    default: null
  },
  payment_details: {
    payment_id: {
      type: String,
      default: null
    },
    razorpay_order_id: {
      type: String,
      default: null
    },
    signature: {
      type: String,
      default: null
    }
  },
  address_snapshot: {
    type: Map,
    of: String,
    default: {}
  },
  delivery: {
    required: {
      type: Boolean,
      default: false
    },
    assigned: {
      type: Boolean,
      default: false
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      default: null
    },
    fee: {
      type: Number,
      default: 0
    },
    distance: {
      type: Number,
      default: 0
    },
    distanceFee: {
      type: Number,
      default: 0
    },
    estimatedTime: {
      type: Number,
      default: 0
    },
    pickupOTP: {
      type: String,
      default: null
    },
    deliveryOTP: {
      type: String,
      default: null
    },
    storeAddress: {
      type: String,
      default: null
    },
    storeCoordinates: {
      latitude: Number,
      longitude: Number
    },
    storeContact: {
      type: String,
      default: null
    }
  },
  timeline: [{
    status: String,
    timestamp: Date
  }],
  items: [orderItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

orderSchema.index({ user_id: 1 });

export default mongoose.model('Order', orderSchema);
