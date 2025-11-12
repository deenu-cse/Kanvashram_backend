const RoomCategory = require('../models/RoomCategory');
const Room = require('../models/Rooms');
const Booking = require('../models/Booking');
const sendWelcomeEmail = require('../utils/bookingWelcomeEmail');

exports.createBooking = async (req, res) => {
  try {
    const { categoryId, guestName, guestEmail, guestPhone, guests, checkIn, checkOut, notes } = req.body;

    if (!categoryId || !guestName || !guestEmail || !guestPhone || !guests || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    const category = await RoomCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Room category not found' });
    }

    if (category.status !== 'available') {
      return res.status(400).json({ message: 'Room category is not available' });
    }

    if (guests > category.maxGuests) {
      return res.status(400).json({ 
        message: `This room can only accommodate ${category.maxGuests} guest(s)` 
      });
    }

    const bookedRooms = await Booking.find({
      status: { $in: ['confirmed', 'checked-in'] },
      category: categoryId,
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
    }).select('room');

    const bookedRoomIds = bookedRooms.map(booking => booking.room.toString());

    const availableRoom = await Room.findOne({
      category: categoryId,
      status: 'available',
      _id: { $nin: bookedRoomIds }
    });

    if (!availableRoom) {
      return res.status(400).json({ message: 'No rooms available for the selected dates' });
    }

    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const totalPrice = category.finalPrice * nights;

    const booking = new Booking({
      category: categoryId,
      room: availableRoom._id,
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

    availableRoom.status = 'occupied';
    await availableRoom.save();

    category.availableRooms -= 1;
    await category.save();

    await booking.populate('category').populate('room');

    try {
      await sendWelcomeEmail({
        to: guestEmail,
        guestName,
        roomName: category.name,
        roomNumber: availableRoom.roomNumber,
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