const Booking = require('../models/Booking');
const Room = require('../models/Rooms');

// Get all bookings with filtering and pagination
exports.getBookings = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    
    if (search) {
      filter.$or = [
        { guestName: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
        { _id: search }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const bookings = await Booking.find(filter)
      .populate('room', 'name images price')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Booking.countDocuments(filter);
    
    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('createdBy', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('room').populate('createdBy', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (status === 'checked-in') {
      await Room.findByIdAndUpdate(booking.room._id, { status: 'occupied' });
    } else if (status === 'checked-out' || status === 'cancelled') {
      await Room.findByIdAndUpdate(booking.room._id, { status: 'available' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const checkedInBookings = await Booking.countDocuments({ status: 'checked-in' });
    
    // Calculate revenue from confirmed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'checked-in', 'checked-out'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);
    
    const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      checkedInBookings,
      revenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};