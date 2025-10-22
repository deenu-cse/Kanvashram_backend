const mongoose = require('mongoose');

const seatAvailabilitySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['foreigner', 'indian', 'student'],
    unique: true
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 0
  },
  bookedSeats: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR', 'USD']
  }
}, {
  timestamps: true
});

seatAvailabilitySchema.virtual('availableSeats').get(function() {
  return this.totalSeats - this.bookedSeats;
});

seatAvailabilitySchema.methods.hasAvailableSeats = function(quantity = 1) {
  return this.availableSeats >= quantity;
};

seatAvailabilitySchema.methods.bookSeats = function(quantity = 1) {
  if (!this.hasAvailableSeats(quantity)) {
    throw new Error(`Not enough seats available for ${this.category}`);
  }
  this.bookedSeats += quantity;
  return this.save();
};

seatAvailabilitySchema.methods.releaseSeats = function(quantity = 1) {
  this.bookedSeats = Math.max(0, this.bookedSeats - quantity);
  return this.save();
};

module.exports = mongoose.model('SeatAvailability', seatAvailabilitySchema);