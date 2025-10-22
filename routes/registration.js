const express = require('express');
const router = express.Router();
const {
  createRegistration,
  verifyPayment,
  getSeatAvailability,
  getRegistration
} = require('../controllers/registrationController');

router.post('/', createRegistration);


router.post('/verify-payment', verifyPayment);

router.get('/seats', getSeatAvailability);


router.get('/:id', getRegistration);

module.exports = router;