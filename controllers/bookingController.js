const Booking = require('../models/Booking');
const Room = require('../models/Rooms');
const RoomCategory = require('../models/RoomCategory');

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
      .populate('category', 'name images basePrice')
      .populate('room', 'roomNumber floor')
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
      .populate('category')
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
    
    const booking = await Booking.findById(req.params.id)
      .populate('category')
      .populate('room');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Handle room and category updates based on status change
    if (status === 'checked-in') {
      // Room is already occupied when booking is confirmed
      await Room.findByIdAndUpdate(booking.room._id, { status: 'occupied' });
    } else if (status === 'checked-out' || status === 'cancelled') {
      // Free up the room
      await Room.findByIdAndUpdate(booking.room._id, { status: 'available' });
      
      // Increase available rooms count in category
      await RoomCategory.findByIdAndUpdate(
        booking.category._id,
        { $inc: { availableRooms: 1 } }
      );
    } else if (oldStatus === 'checked-out' && status === 'confirmed') {
      // Re-occupy the room if changing back from checked-out
      await Room.findByIdAndUpdate(booking.room._id, { status: 'occupied' });
      
      // Decrease available rooms count in category
      await RoomCategory.findByIdAndUpdate(
        booking.category._id,
        { $inc: { availableRooms: -1 } }
      );
    }

    await booking.populate('category').populate('room').populate('createdBy', 'name email');
    
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
    const checkedOutBookings = await Booking.countDocuments({ status: 'checked-out' });
    
    // Calculate revenue from completed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'checked-in', 'checked-out'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);
    
    const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    const roomStats = await RoomCategory.aggregate([
      {
        $group: {
          _id: null,
          totalRooms: { $sum: '$totalRooms' },
          availableRooms: { $sum: '$availableRooms' }
        }
      }
    ]);
    
    const stats = roomStats.length > 0 ? roomStats[0] : { totalRooms: 0, availableRooms: 0 };
    const occupiedRooms = stats.totalRooms - stats.availableRooms;
    const occupancyRate = stats.totalRooms > 0 ? (occupiedRooms / stats.totalRooms) * 100 : 0;
    
    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      checkedInBookings,
      checkedOutBookings,
      revenue,
      totalRooms: stats.totalRooms,
      availableRooms: stats.availableRooms,
      occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};