
const Room = require('../models/Rooms');
const Booking = require('../models/Booking');
const { sendWelcomeEmail } = require('../utils/bookingWelcomeEmail');

exports.createBooking = async (req, res) => {
  try {
    const { roomId, guestName, guestEmail, guestPhone, guests, checkIn, checkOut, notes } = req.body;

    if (!roomId || !guestName || !guestEmail || !guestPhone || !guests || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'available') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    const existingBooking = await Booking.findOne({
      room: roomId,
      status: { $in: ['confirmed', 'checked-in'] },
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate },
        },
      ],
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Room is not available for the selected dates' });
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
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