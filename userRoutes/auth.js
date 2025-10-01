
const express = require('express');
const { register, login } = require('../userController/authController');
const router = express.Router();


// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
// router.get('/profile', authenticate, getProfile);
// router.put('/profile', authenticate, updateProfile);
// router.put('/change-password', authenticate, changePassword);

module.exports = router;