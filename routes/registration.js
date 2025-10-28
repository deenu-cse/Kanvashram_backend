const express = require('express');
const router = express.Router();
const {
  createRegistration,
  verifyPayment,
  getSeatAvailability,
  getRegistration
} = require('../controllers/registrationController');

router.get('/availseats', getSeatAvailability);

router.post('/', createRegistration);


router.post('/verify-payment', verifyPayment);


router.get('/:id', getRegistration);

module.exports = router;