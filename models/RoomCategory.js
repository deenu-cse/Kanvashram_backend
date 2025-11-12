const mongoose = require('mongoose');

const roomCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  beds: {
    type: Number,
    required: true,
    min: 1
  },
  maxGuests: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'double', 'suite', 'dormitory'],
    default: 'single'
  },
  amenities: [{
    type: String
  }],
  totalRooms: {
    type: Number,
    required: true,
    min: 1
  },
  availableRooms: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'maintenance'],
    default: 'available'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

roomCategorySchema.virtual('finalPrice').get(function() {
  return this.basePrice - (this.basePrice * this.discount / 100);
});

roomCategorySchema.pre('save', function(next) {
  if (this.isModified('totalRooms') && !this.isModified('availableRooms')) {
    this.availableRooms = this.totalRooms;
  }
  next();
});

module.exports = mongoose.model('RoomCategory', roomCategorySchema);