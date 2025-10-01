const express = require('express');
const {
  getBookings,
  getBooking,
  updateBookingStatus,
  getBookingStats
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getBookings);
router.get('/stats', getBookingStats);
router.get('/:id', getBooking);
router.put('/:id/status', authorize('admin', 'super-admin'), updateBookingStatus);

module.exports = router;