
const User = require('../userModel/user');
const jwt = require('jsonwebtoken');
// const { sendWelcomeEmail } = require('../utils/emailService');

const generateTokens = (user) => {
  const accessToken = user.generateAuthToken();
  return { accessToken };
};

exports.register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      dateOfBirth, 
      spiritualName,
      purposeOfVisit,
      dietaryPreferences 
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      dateOfBirth,
      spiritualName,
      purposeOfVisit,
      dietaryPreferences
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);

    user.lastLogin = new Date();
    await user.save();

    // try {
    //   await sendWelcomeEmail(user.email, user.name);
    // } catch (emailError) {
    //   console.error('Failed to send welcome email:', emailError);
    // }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Refresh token
// exports.refreshToken = async (req, res) => {
//   try {
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//       return res.status(401).json({
//         success: false,
//         message: 'Refresh token required'
//       });
//     }

//     const decoded = jwt.verify(
//       refreshToken, 
//       process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
//     );

//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid refresh token'
//       });
//     }

//     const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

//     res.json({
//       success: true,
//       data: {
//         accessToken,
//         refreshToken: newRefreshToken
//       }
//     });

//   } catch (error) {
//     console.error('Token refresh error:', error);
//     res.status(401).json({
//       success: false,
//       message: 'Invalid refresh token'
//     });
//   }
// };

// // Get current user profile
// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId);
    
//     res.json({
//       success: true,
//       data: { user }
//     });

//   } catch (error) {
//     console.error('Get profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Update user profile
// exports.updateProfile = async (req, res) => {
//   try {
//     const updates = req.body;
//     const allowedUpdates = [
//       'name', 'phone', 'dateOfBirth', 'address', 'emergencyContact', 
//       'spiritualName', 'purposeOfVisit', 'dietaryPreferences', 'avatar', 'preferences'
//     ];
    
//     const filteredUpdates = {};
//     Object.keys(updates).forEach(key => {
//       if (allowedUpdates.includes(key)) {
//         filteredUpdates[key] = updates[key];
//       }
//     });

//     const user = await User.findByIdAndUpdate(
//       req.user.userId,
//       filteredUpdates,
//       { new: true, runValidators: true }
//     );

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: { user }
//     });

//   } catch (error) {
//     console.error('Update profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

// // Change password
// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     const user = await User.findById(req.user.userId);
    
//     const isCurrentPasswordValid = await user.comparePassword(currentPassword);
//     if (!isCurrentPasswordValid) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current password is incorrect'
//       });
//     }

//     user.password = newPassword;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Password changed successfully'
//     });

//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };