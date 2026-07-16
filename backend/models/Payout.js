import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
    required: true
  },
  payoutPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  orders: [{
    deliveryOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryOrder'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    earning: Number,
    completedAt: Date
  }],
  summary: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalDistance: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'wallet'],
      default: 'bank_transfer'
    },
    transactionId: String,
    processedAt: Date,
    failureReason: String
  },
  payoutFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
payoutSchema.index({ deliveryPartnerId: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ 'payoutPeriod.startDate': 1 });
payoutSchema.index({ 'payoutPeriod.endDate': 1 });
payoutSchema.index({ createdAt: -1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;
