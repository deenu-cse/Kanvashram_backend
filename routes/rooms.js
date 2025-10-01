const express = require('express');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomStats
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/', getRooms);
router.get('/stats', getRoomStats);
router.get('/:id', getRoom);
router.post('/', authorize('admin', 'super-admin'), upload.array('images', 5), createRoom);
router.put('/:id', authorize('admin', 'super-admin'), upload.array('images', 5), updateRoom);
router.delete('/:id', authorize('super-admin'), deleteRoom);

module.exports = router;