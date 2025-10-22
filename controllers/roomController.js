const Room = require('../models/Rooms');
const { cloudinary } = require('../middleware/cloudinary');

// Get all rooms with filtering and pagination
exports.getRooms = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const rooms = await Room.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
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
    const room = await Room.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create room
exports.createRoom = async (req, res) => {
  try {
    // Get image URLs from Cloudinary
    const images = req.files ? req.files.map(file => file.path) : [];

    const roomData = {
      ...req.body,
      images: images,
      createdBy: req.admin.id
    };
    
    const room = new Room(roomData);
    await room.save();
    
    await room.populate('createdBy', 'name email');
    
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update room
exports.updateRoom = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // If new images are uploaded, add them to update data
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      
      // If you want to replace all images
      updateData.images = newImages;
      
      // If you want to keep old images and add new ones
      const room = await Room.findById(req.params.id);
      updateData.images = [...room.images, ...newImages];
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete room and associated images from Cloudinary
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Delete images from Cloudinary
    if (room.images && room.images.length > 0) {
      for (const imageUrl of room.images) {
        // Extract public_id from Cloudinary URL
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`hotel-rooms/${publicId}`);
      }
    }

    await Room.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get room statistics
exports.getRoomStats = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const maintenanceRooms = await Room.countDocuments({ status: 'maintenance' });
    
    res.json({
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};