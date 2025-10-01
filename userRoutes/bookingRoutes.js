const express = require('express');
const router = express.Router();
const {checkAvailability, checkRoomAvailability, getRoomDetails} = require('../userController/roomAvailability')

router.post('/room/availability', checkAvailability);
router.post('/room/:id/check', checkRoomAvailability);
router.get('/room/:id', getRoomDetails);

module.exports = router;