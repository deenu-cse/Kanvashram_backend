const RoomCategory = require('../models/RoomCategory');
const Room = require('../models/Rooms');
const { cloudinary } = require('../middleware/cloudinary');

exports.getRoomCategories = async (req, res) => {
  try {
    const { search, status, type, page = 1, limit = 10 } = req.query;
    
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
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    const categories = await RoomCategory.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await RoomCategory.countDocuments(filter);
    
    res.json({
      categories,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoomCategory = async (req, res) => {
  try {
    const category = await RoomCategory.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!category) {
      return res.status(404).json({ message: 'Room category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRoomCategory = async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => file.path) : [];

    const categoryData = {
      ...req.body,
      images: images,
      availableRooms: req.body.totalRooms,
      createdBy: req.admin.id
    };
    
    const category = new RoomCategory(categoryData);
    await category.save();
    
    await createIndividualRooms(category._id, req.body.totalRooms, req.admin.id);
    
    await category.populate('createdBy', 'name email');
    
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRoomCategory = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      
      updateData.images = newImages;
      
      const category = await RoomCategory.findById(req.params.id);
      updateData.images = [...category.images, ...newImages];
    }

    if (updateData.totalRooms) {
      const currentCategory = await RoomCategory.findById(req.params.id);
      const roomDifference = updateData.totalRooms - currentCategory.totalRooms;
      
      if (roomDifference > 0) {
        await createIndividualRooms(req.params.id, roomDifference, req.admin.id);
        updateData.availableRooms = currentCategory.availableRooms + roomDifference;
      } else if (roomDifference < 0) {
        const roomsToRemove = Math.abs(roomDifference);
        const availableRooms = await Room.find({ 
          category: req.params.id, 
          status: 'available' 
        }).limit(roomsToRemove);
        
        if (availableRooms.length < roomsToRemove) {
          return res.status(400).json({ 
            message: `Cannot reduce room count. Only ${availableRooms.length} rooms are available for removal.` 
          });
        }
        
        await Room.deleteMany({ 
          _id: { $in: availableRooms.map(room => room._id) } 
        });
        
        updateData.availableRooms = currentCategory.availableRooms - roomsToRemove;
      }
    }

    const category = await RoomCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!category) {
      return res.status(404).json({ message: 'Room category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRoomCategory = async (req, res) => {
  try {
    const category = await RoomCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Room category not found' });
    }

    const activeBookings = await Booking.countDocuments({
      category: req.params.id,
      status: { $in: ['confirmed', 'checked-in'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with active bookings' 
      });
    }

    if (category.images && category.images.length > 0) {
      for (const imageUrl of category.images) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`hotel-rooms/${publicId}`);
      }
    }
    await Room.deleteMany({ category: req.params.id });

    await RoomCategory.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Room category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoomCategoryStats = async (req, res) => {
  try {
    const totalCategories = await RoomCategory.countDocuments();
    const availableCategories = await RoomCategory.countDocuments({ status: 'available' });
    const maintenanceCategories = await RoomCategory.countDocuments({ status: 'maintenance' });
    
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
    
    res.json({
      totalCategories,
      availableCategories,
      maintenanceCategories,
      ...stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoomsByCategory = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { category: req.params.id };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const rooms = await Room.find(filter)
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

const createIndividualRooms = async (categoryId, count, adminId) => {
  const category = await RoomCategory.findById(categoryId);
  const existingRooms = await Room.countDocuments({ category: categoryId });
  
  const rooms = [];
  for (let i = 1; i <= count; i++) {
    const roomNumber = `${category.type.charAt(0).toUpperCase()}${existingRooms + i}`;
    rooms.push({
      roomNumber,
      category: categoryId,
      floor: Math.ceil((existingRooms + i) / 10), 
      status: 'available',
      createdBy: adminId
    });
  }
  
  await Room.insertMany(rooms);
};