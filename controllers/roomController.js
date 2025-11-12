const Room = require('../models/Rooms');
const RoomCategory = require('../models/RoomCategory');

exports.getRooms = async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    
    if (search) {
      filter.roomNumber = { $regex: search, $options: 'i' };
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    const rooms = await Room.find(filter)
      .populate('category', 'name type basePrice')
      .populate('createdBy', 'name email')
      .sort({ roomNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Room.countDocuments(filter);
    
    res.json({
      rooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single room
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('category')
      .populate('createdBy', 'name email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update room
exports.updateRoom = async (req, res) => {
  try {
    const { status, roomNumber } = req.body;

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status, roomNumber },
      { new: true, runValidators: true }
    ).populate('category').populate('createdBy', 'name email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // If room status changes from occupied to available, update category available count
    if (req.body.status === 'available' && room.status === 'occupied') {
      await RoomCategory.findByIdAndUpdate(
        room.category._id,
        { $inc: { availableRooms: 1 } }
      );
    } else if (req.body.status === 'occupied' && room.status === 'available') {
      await RoomCategory.findByIdAndUpdate(
        room.category._id,
        { $inc: { availableRooms: -1 } }
      );
    }
    
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get room statistics
exports.getRoomStats = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const maintenanceRooms = await Room.countDocuments({ status: 'maintenance' });
    const cleaningRooms = await Room.countDocuments({ status: 'cleaning' });
    
    res.json({
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      cleaningRooms
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};