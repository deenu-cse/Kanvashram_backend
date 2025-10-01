const Booking = require("../models/Booking");
const Rooms = require("../models/Rooms");


exports.checkAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut, guests, roomType, amenities, priceRange } = req.body;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    let query = { status: 'available' };

    if (roomType && roomType !== 'any') {
      query.type = roomType;
    }

    if (amenities && amenities.length > 0) {
      query.amenities = { $all: amenities };
    }

    if (priceRange && priceRange !== 'any') {
      const [min, max] = priceRange.split('-').map(p =>
        p.includes('+') ? Number.POSITIVE_INFINITY : parseInt(p.replace('₹', '').replace(',', ''))
      );
      query.price = { $gte: min };
      if (max !== Number.POSITIVE_INFINITY) {
        query.price = { ...query.price, $lte: max };
      }
    }

    if (guests) {
      query.maxGuests = { $gte: parseInt(guests) };
    }

    const allRooms = await Rooms.find(query);

    const bookedRooms = await Booking.find({
      status: { $in: ['confirmed', 'checked-in'] },
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate },
        },
      ],
    }).select('room');

    const bookedRoomIds = bookedRooms.map(booking => booking.room.toString());

    const availableRooms = allRooms.filter(room => !bookedRoomIds.includes(room._id.toString()));

    res.status(200).json({
      success: true,
      data: availableRooms,
      total: availableRooms.length,
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.checkRoomAvailability = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, guests } = req.body;

  try {
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const room = await Rooms.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'available') {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Room is not available',
      });
    }

    if (guests && guests > room.maxGuests) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `Room can accommodate maximum ${room.maxGuests} guests`,
      });
    }

    const existingBooking = await Booking.findOne({
      room: id,
      status: { $in: ['confirmed', 'checked-in'] },
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate },
        },
      ],
    });

    const available = !existingBooking;

    res.status(200).json({
      success: true,
      available,
      message: available ? 'Room is available' : 'Room is not available for the selected dates',
    });
  } catch (error) {
    console.error('Room availability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.getRoomDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const room = await Rooms.findById(id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Room details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};