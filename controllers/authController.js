const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetOTP } = require('../utils/adminEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const existingSuperAdmin = await Admin.findOne({ role: 'super-admin' });
    if (existingSuperAdmin && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Super admin already exists. Use authenticated route.'
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    const superAdmin = await Admin.create({
      name,
      email,
      password,
      role: 'super-admin',
      status: 'active' 
    });

    res.status(201).json({
      success: true,
      message: 'Super admin registered successfully',
      data: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        status: superAdmin.status,
        createdAt: superAdmin.createdAt
      }
    });

  } catch (error) {
    console.error('Super admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering super admin',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (admin.status !== 'active') {
      return res.status(401).json({ message: 'Your account is not active' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id);

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json({
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        status: req.admin.status,
        lastLogin: req.admin.lastLogin,
        createdAt: req.admin.createdAt,
        updatedAt: req.admin.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot password - Generate and send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    // Don't reveal if admin exists or not for security
    if (!admin) {
      return res.status(200).json({ 
        success: true,
        message: 'If an account with this email exists, a password reset OTP has been sent.' 
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: 'Your account is not active. Please contact support.' 
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Set OTP expiry to 10 minutes from now
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    // Save OTP and expiry (use select: false to exclude from queries by default)
    admin.resetPasswordOTP = otp;
    admin.resetPasswordOTPExpiry = otpExpiry;
    await admin.save({ validateBeforeSave: false });

    // Send OTP email
    try {
      await sendPasswordResetOTP(admin, otp);
      
      res.status(200).json({
        success: true,
        message: 'Password reset OTP has been sent to your email address. Please check your inbox.'
      });
    } catch (emailError) {
      // If email fails, clear OTP
      admin.resetPasswordOTP = undefined;
      admin.resetPasswordOTPExpiry = undefined;
      await admin.save({ validateBeforeSave: false });

      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing password reset request',
      error: error.message 
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

    // Find admin with OTP fields included
    const admin = await Admin.findOne({ 
      email: email.toLowerCase() 
    }).select('+resetPasswordOTP +resetPasswordOTPExpiry');

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid email or OTP' 
      });
    }

    // Check if OTP exists and matches
    if (!admin.resetPasswordOTP || admin.resetPasswordOTP !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }

    // Check if OTP is expired
    if (admin.resetPasswordOTPExpiry < new Date()) {
      // Clear expired OTP
      admin.resetPasswordOTP = undefined;
      admin.resetPasswordOTPExpiry = undefined;
      await admin.save({ validateBeforeSave: false });

      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // OTP is valid - return success (don't clear OTP yet, will be cleared on password reset)
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying OTP',
      error: error.message 
    });
  }
};

// Reset password after OTP verification
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, OTP, and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find admin with OTP fields included
    const admin = await Admin.findOne({ 
      email: email.toLowerCase() 
    }).select('+resetPasswordOTP +resetPasswordOTPExpiry');

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid email or OTP' 
      });
    }

    // Verify OTP
    if (!admin.resetPasswordOTP || admin.resetPasswordOTP !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }

    // Check if OTP is expired
    if (admin.resetPasswordOTPExpiry < new Date()) {
      // Clear expired OTP
      admin.resetPasswordOTP = undefined;
      admin.resetPasswordOTPExpiry = undefined;
      await admin.save({ validateBeforeSave: false });

      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Update password and clear OTP
    admin.password = newPassword;
    admin.resetPasswordOTP = undefined;
    admin.resetPasswordOTPExpiry = undefined;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error resetting password',
      error: error.message 
    });
  }
};