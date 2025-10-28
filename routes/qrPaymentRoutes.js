const express = require('express');
const router = express.Router();
const {
  createQrPayment,
  uploadScreenshot,
  getAllQrPayments,
  getQrPayment,
  updatePaymentStatus,
  sendEventPass,
  getQrPaymentStats,
  trackPayment
} = require('../controllers/qrPaymentController');
const { upload, handleUploadErrors } = require('../middleware/cloudinary'); 
const { protect, authorize } = require('../middleware/auth');
const { getSeatAvailability } = require('../controllers/registrationController');

// Public routes
router.post('/user/qr-payments', createQrPayment);
router.post('/user/qr-payments/:id/upload', upload.single('screenshot'),  handleUploadErrors, uploadScreenshot);
router.get('/user/track-payment/:transactionId', trackPayment);
router.get('/user/seats', getSeatAvailability);


// Protected admin routes
router.use(protect);
router.get('/admin/qr-payments', authorize('admin', 'super-admin'), getAllQrPayments);
router.get('/admin/qr-payments/stats', authorize('admin', 'super-admin'), getQrPaymentStats);
router.get('/admin/qr-payments/:id', authorize('admin', 'super-admin'), getQrPayment);
router.put('/admin/qr-payments/:id/status', authorize('admin', 'super-admin'), updatePaymentStatus);
router.post('/admin/pass/:id/send-pass', authorize('admin', 'super-admin'), sendEventPass);

module.exports = router;