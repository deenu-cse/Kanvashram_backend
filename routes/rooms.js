const express = require('express');
const {
  getRooms,
  getRoom,
  updateRoom,
  getRoomStats
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getRooms);
router.get('/stats', getRoomStats);
router.get('/:id', getRoom);
router.put('/:id', authorize('admin', 'super-admin'), updateRoom);

module.exports = router;