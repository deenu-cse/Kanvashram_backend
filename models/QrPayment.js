const mongoose = require('mongoose');

const qrPaymentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['foreigner', 'indian', 'student']
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR', 'USD']
  },
  screenshot: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    }
  },
  transactionId: {
    type: String,
    default: () => `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'completed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  eventPassSent: {
    type: Boolean,
    default: false
  },
  eventPassCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

qrPaymentSchema.index({ email: 1, createdAt: -1 });
qrPaymentSchema.index({ status: 1 });
qrPaymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('QrPayment', qrPaymentSchema);