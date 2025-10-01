const express = require('express');
const {
  getAdmins,
  createAdmin,
  bulkCreateAdmins,
  updateAdminStatus,
  getAdminStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('super-admin'));

router.get('/', getAdmins);
router.get('/stats', getAdminStats);
router.post('/', createAdmin);
router.post('/bulk', bulkCreateAdmins);
router.put('/:id/status', updateAdminStatus);

module.exports = router;