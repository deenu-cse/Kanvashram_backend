const express = require('express');
const {
    getDonations,
    getDonation,
    createDonation,
    updateDonation,
    deleteDonation,
    toggleDonationStatus,
    getDonationStats
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route - get active donations
router.get('/active', getDonations);

// Protected routes
router.use(protect);

// Admin routes
router.get('/', authorize('admin', 'super-admin'), getDonations);
router.get('/:id', authorize('admin', 'super-admin'), getDonation);
router.post('/', authorize('admin', 'super-admin'), createDonation);
router.put('/:id', authorize('admin', 'super-admin'), updateDonation);
router.delete('/:id', authorize('admin', 'super-admin'), deleteDonation);
router.patch('/:id/status', authorize('admin', 'super-admin'), toggleDonationStatus);
router.get('/stats', getDonationStats);

module.exports = router;