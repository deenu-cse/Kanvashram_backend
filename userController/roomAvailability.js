
const Booking = require("../models/Booking");
const RoomCategory = require("../models/RoomCategory");
const Room = require("../models/Rooms");

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
      query.basePrice = { $gte: min };
      if (max !== Number.POSITIVE_INFINITY) {
        query.basePrice = { ...query.basePrice, $lte: max };
      }
    }

    if (guests) {
      query.maxGuests = { $gte: parseInt(guests) };
    }

    const allCategories = await RoomCategory.find(query);

    // Get booked rooms for the date range
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

    // Get available rooms for each category
    const availableCategories = await Promise.all(
      allCategories.map(async (category) => {
        const availableRoomsInCategory = await Room.find({
          category: category._id,
          status: 'available',
          _id: { $nin: bookedRoomIds }
        });

        return {
          ...category.toObject(),
          availableRoomsCount: availableRoomsInCategory.length,
          availableRooms: availableRoomsInCategory
        };
      })
    );

    // Filter categories that have at least one available room
    const categoriesWithAvailability = availableCategories.filter(
      category => category.availableRoomsCount > 0
    );

    res.status(200).json({
      success: true,
      data: categoriesWithAvailability,
      total: categoriesWithAvailability.length,
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

    const category = await RoomCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Room category not found' });
    }

    if (category.status !== 'available') {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Room category is not available',
      });
    }

    if (guests && guests > category.maxGuests) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `Room can accommodate maximum ${category.maxGuests} guests`,
      });
    }

    // Check available rooms in this category for the dates
    const bookedRooms = await Booking.find({
      status: { $in: ['confirmed', 'checked-in'] },
      category: id,
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate },
        },
      ],
    }).select('room');

    const bookedRoomIds = bookedRooms.map(booking => booking.room.toString());

    const availableRoom = await Room.findOne({
      category: id,
      status: 'available',
      _id: { $nin: bookedRoomIds }
    });

    const available = !!availableRoom;

    res.status(200).json({
      success: true,
      available,
      availableRoom: available ? availableRoom : null,
      message: available ? 'Room is available' : 'No rooms available for the selected dates',
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
    const category = await RoomCategory.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Room category not found' });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Room details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};