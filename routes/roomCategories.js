const express = require('express');
const {
  getRoomCategories,
  getRoomCategory,
  createRoomCategory,
  updateRoomCategory,
  deleteRoomCategory,
  getRoomCategoryStats,
  getRoomsByCategory
} = require('../controllers/roomCategoryController');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadErrors } = require('../middleware/cloudinary'); 

const router = express.Router();

router.use(protect);

router.get('/', getRoomCategories);
router.get('/stats', getRoomCategoryStats);
router.get('/:id', getRoomCategory);
router.get('/:id/rooms', getRoomsByCategory);
router.post('/', 
  authorize('admin', 'super-admin'), 
  upload.array('images', 5), 
  handleUploadErrors,
  createRoomCategory
);
router.put('/:id', 
  authorize('admin', 'super-admin'), 
  upload.array('images', 5), 
  handleUploadErrors,
  updateRoomCategory
);
router.delete('/:id', authorize('super-admin'), deleteRoomCategory);

module.exports = router;