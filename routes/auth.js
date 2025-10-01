const express = require('express');
const { login, getMe, changePassword, registerSuperAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register/super-admin', registerSuperAdmin);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);


module.exports = router;