const express = require('express');
const router = express.Router();
const { createBooking } = require('../userController/bookRoom');
const { checkAvailability, checkRoomAvailability, getRoomDetails } = require('../userController/roomAvailability');

console.log("📦 roomBooking routes loaded");


router.post('/book', createBooking);

router.post('/room/availability', checkAvailability);

router.post('/room/:id/check', checkRoomAvailability);
router.get('/room/:id', getRoomDetails);

module.exports = router;