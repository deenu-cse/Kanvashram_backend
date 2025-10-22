const Room = require('../models/Rooms');
const Booking = require('../models/Booking');
const sendWelcomeEmail  = require('../utils/bookingWelcomeEmail');

exports.createBooking = async (req, res) => {
  try {
    const { roomId, guestName, guestEmail, guestPhone, guests, checkIn, checkOut, notes } = req.body;

    if (!roomId || !guestName || !guestEmail || !guestPhone || !guests || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'available') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Check guest count
    if (guests > room.maxGuests) {
      return res.status(400).json({ 
        message: `This room can only accommodate ${room.maxGuests} guest(s)` 
      });
    }

    const existingBooking = await Booking.findOne({
      room: roomId,
      status: { $in: ['confirmed', 'checked-in'] }, 
      $or: [
        {
          checkIn: { $lte: checkInDate },
          checkOut: { $gt: checkInDate }
        },
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gte: checkOutDate }
        },
        {
          checkIn: { $gte: checkInDate },
          checkOut: { $lte: checkOutDate }
        }
      ]
    });

    if (existingBooking) {
      console.log('Found conflicting booking:', {
        existingCheckIn: existingBooking.checkIn,
        existingCheckOut: existingBooking.checkOut,
        requestedCheckIn: checkInDate,
        requestedCheckOut: checkOutDate,
        status: existingBooking.status
      });
      return res.status(400).json({ message: 'Room is not available for the selected dates' });
    }

    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const totalPrice = room.price * nights;

    const booking = new Booking({
      room: roomId,
      guestName,
      guestEmail,
      guestPhone,
      guests: parseInt(guests),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      notes,
      status: 'confirmed',
      paymentStatus: 'pending',
    });

    await booking.save();
    await booking.populate('room');

    try {
      await sendWelcomeEmail({
        to: guestEmail,
        guestName,
        roomName: room.name,
        checkIn: checkInDate.toDateString(),
        checkOut: checkOutDate.toDateString(),
        totalPrice,
        bookingId: booking._id,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};