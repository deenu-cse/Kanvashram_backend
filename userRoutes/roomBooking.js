const express = require('express');
const router = express.Router();
const { createBooking } = require('../userController/bookRoom')

router.post('/book', createBooking);

module.exports = router;