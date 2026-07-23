import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false // Made optional for Google OAuth users
  },
  name: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  picture: {
    type: String,
    default: '' // Google profile picture
  },
  location: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: [String],
    enum: ['customer', 'admin', 'delivery_partner'],
    default: ['customer']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  hasUsedFirstOrderDiscount: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to compare password (for regular login)
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
