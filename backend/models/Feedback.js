import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  
  // Product quality rating (1-5 stars)
  productQuality: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comments: String
  },
  
  // Delivery experience rating (1-5 stars)
  deliveryExperience: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comments: String
  },
  
  // Overall service rating (1-5 stars)
  overallService: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comments: String
  },
  
  // Queries or concerns
  queries: {
    type: String,
    default: ''
  },
  
  // Suggestions for improvement
  suggestions: {
    type: String,
    default: ''
  },
  
  // Would recommend to others
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  
  // Admin response
  adminResponse: {
    responded: {
      type: Boolean,
      default: false
    },
    response: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Feedback status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Feedback', feedbackSchema);
