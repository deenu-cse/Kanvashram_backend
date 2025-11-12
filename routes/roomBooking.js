const express = require('express');
const router = express.Router();
const { createBooking } = require('../userController/bookRoom');
const { checkAvailability, checkRoomAvailability, getRoomDetails } = require('../userController/roomAvailability');

console.log("📦 roomBooking routes loaded");


router.post('/book', createBooking);

router.post('/room/availability', checkAvailability);

router.get('/room/:id', getRoomDetails);
router.post('/room/:id/check', checkRoomAvailability);

module.exports = router;