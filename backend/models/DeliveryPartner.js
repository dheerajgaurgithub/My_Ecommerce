import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalDetails: {
    fullName: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    }
  },
  kycDetails: {
    aadharNumber: {
      type: String,
      required: true,
      unique: true
    },
    panNumber: {
      type: String,
      required: true
    },
    selfie: {
      type: String,
      required: true
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    kycRejectedReason: {
      type: String
    },
    verifiedAt: {
      type: Date
    }
  },
  vehicleDetails: {
    vehicleType: {
      type: String,
      enum: ['motorcycle', 'car', 'van', 'bicycle'],
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true
    },
    vehicleModel: {
      type: String,
      required: true
    },
    vehicleColor: {
      type: String,
      required: true
    }
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    landmark: {
      type: String
    },
    coordinates: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      }
    }
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: true
    },
    accountHolderName: {
      type: String,
      required: true
    },
    ifscCode: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    }
  },
  payoutSettings: {
    payoutFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    payoutDay: {
      type: Number
    },
    upiId: {
      type: String
    }
  },
  workDetails: {
    isOnline: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      },
      lastUpdated: {
        type: Date
      }
    },
    preferredStoreIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    }],
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    totalDeliveries: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'payment_pending', 'active', 'inactive', 'suspended', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  joiningFee: {
    amount: {
      type: Number,
      default: 500
    },
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    },
    paymentId: {
      type: String
    }
  },
  renewalFee: {
    amount: {
      type: Number,
      default: 200
    },
    lastPaidAt: {
      type: Date
    },
    nextDueDate: {
      type: Date
    },
    isPaid: {
      type: Boolean,
      default: true
    }
  },
  emergencyContact: {
    name: {
      type: String
    },
    relationship: {
      type: String
    },
    contactNumber: {
      type: String
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
deliveryPartnerSchema.index({ 'personalDetails.contactNumber': 1 });
deliveryPartnerSchema.index({ 'personalDetails.email': 1 });
deliveryPartnerSchema.index({ 'kycDetails.aadharNumber': 1 });
deliveryPartnerSchema.index({ 'vehicleDetails.vehicleNumber': 1 });
deliveryPartnerSchema.index({ status: 1 });
deliveryPartnerSchema.index({ 'workDetails.isOnline': 1 });
deliveryPartnerSchema.index({ 'workDetails.currentLocation.coordinates': '2dsphere' });

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);

export default DeliveryPartner;
