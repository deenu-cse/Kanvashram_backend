const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.getAdmins = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const admins = await Admin.find(filter)
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');
    
    const total = await Admin.countDocuments(filter);
    
    res.json({
      admins,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }
    
    const adminData = {
      name,
      email,
      role: role || 'admin',
      status: 'pending',
      invitedBy: req.admin.id
    };
    
    const admin = new Admin(adminData);
    await admin.save();
    
    // In a real application, send invitation email here
    // await sendInvitationEmail(email, name, invitationToken);
    
    const adminWithoutPassword = await Admin.findById(admin._id)
      .populate('invitedBy', 'name email')
      .select('-password');
    
    res.status(201).json(adminWithoutPassword);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Bulk create admins
exports.bulkCreateAdmins = async (req, res) => {
  try {
    const { admins } = req.body; // array of { name, email, role }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const adminData of admins) {
      try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminData.email });
        if (existingAdmin) {
          results.failed.push({
            ...adminData,
            error: 'Admin with this email already exists'
          });
          continue;
        }
        
        const newAdmin = new Admin({
          ...adminData,
          status: 'pending',
          invitedBy: req.admin.id
        });
        
        await newAdmin.save();
        
        const adminWithoutPassword = await Admin.findById(newAdmin._id)
          .select('-password');
        
        results.successful.push(adminWithoutPassword);
        
        // Send invitation email
        // await sendInvitationEmail(adminData.email, adminData.name);
        
      } catch (error) {
        results.failed.push({
          ...adminData,
          error: error.message
        });
      }
    }
    
    res.status(201).json(results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update admin status
exports.updateAdminStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Prevent self-deactivation
    if (req.params.id === req.admin.id && status === 'inactive') {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }
    
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get admin statistics
exports.getAdminStats = async (req, res) => {
  try {
    const totalAdmins = await Admin.countDocuments();
    const activeAdmins = await Admin.countDocuments({ status: 'active' });
    const pendingAdmins = await Admin.countDocuments({ status: 'pending' });
    const inactiveAdmins = await Admin.countDocuments({ status: 'inactive' });
    
    res.json({
      totalAdmins,
      activeAdmins,
      pendingAdmins,
      inactiveAdmins
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};