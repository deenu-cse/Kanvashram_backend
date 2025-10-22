const Registration = require('../models/Registration');
const SeatAvailability = require('../models/SeatAvailability');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

const initializeSeats = async () => {
  try {
    const seats = [
      { category: 'foreigner', totalSeats: 60, price: 500, currency: 'USD' },
      { category: 'indian', totalSeats: 60, price: 21000, currency: 'INR' },
      { category: 'student', totalSeats: 50, price: 11000, currency: 'INR' }
    ];

    for (const seat of seats) {
      await SeatAvailability.findOneAndUpdate(
        { category: seat.category },
        seat,
        { upsert: true, new: true }
      );
    }
    console.log('Seat availability initialized');
  } catch (error) {
    console.error('Error initializing seats:', error);
  }
};

exports.createRegistration = async (req, res) => {
  try {
    const { fullName, email, country, phone, category } = req.body;

    if (!fullName || !email || !country || !phone || !category) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const seatAvailability = await SeatAvailability.findOne({ category });
    if (!seatAvailability) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    if (!seatAvailability.hasAvailableSeats()) {
      return res.status(400).json({
        success: false,
        message: 'No seats available for this category'
      });
    }

    const existingRegistration = await Registration.findOne({
      email,
      status: { $in: ['pending', 'completed'] }
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You already have a registration with this email'
      });
    }

    const amount = seatAvailability.price;
    const currency = seatAvailability.currency;
    
    const amountInSmallestUnit = currency === 'INR' ? amount * 100 : amount * 100;

    const options = {
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      receipt: `receipt_${Date.now()}`,
      notes: {
        name: fullName,
        email: email,
        category: category
      }
    };

    const order = await razorpay.orders.create(options);

    const registration = new Registration({
      fullName,
      email,
      country,
      phone,
      category,
      amount: amount,
      currency: currency,
      razorpayOrderId: order.id,
      status: 'pending'
    });

    await registration.save();

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      registration: {
        id: registration._id,
        amount: registration.amount,
        currency: registration.currency
      },
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating registration',
      error: error.message
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details'
      });
    }

    const registration = await Registration.findOne({ razorpayOrderId: razorpay_order_id });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      registration.status = 'failed';
      registration.paymentDetails = { error: 'Invalid signature' };
      await registration.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const seatAvailability = await SeatAvailability.findOne({ category: registration.category });
    if (!seatAvailability.hasAvailableSeats()) {
      registration.status = 'failed';
      registration.paymentDetails = { error: 'No seats available' };
      await registration.save();

      return res.status(400).json({
        success: false,
        message: 'No seats available. Payment refund will be processed.'
      });
    }

    await seatAvailability.bookSeats(1);

    registration.razorpayPaymentId = razorpay_payment_id;
    registration.razorpaySignature = razorpay_signature;
    registration.status = 'completed';
    registration.transactionId = `TXN${Date.now()}`;
    registration.paymentDetails = {
      verified: true,
      verifiedAt: new Date()
    };

    await registration.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      registration: {
        id: registration._id,
        transactionId: registration.transactionId,
        status: registration.status,
        amount: registration.amount,
        currency: registration.currency
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

exports.getSeatAvailability = async (req, res) => {
  try {
    const seats = await SeatAvailability.find({});
    
    const availability = seats.map(seat => ({
      category: seat.category,
      emoji: getEmojiForCategory(seat.category),
      total: seat.totalSeats,
      available: seat.availableSeats,
      price: formatPrice(seat.price, seat.currency),
      priceInr: seat.currency === 'INR',
      percentage: Math.round((seat.availableSeats / seat.totalSeats) * 100)
    }));

    res.json({
      success: true,
      data: availability
    });

  } catch (error) {
    console.error('Get seat availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seat availability',
      error: error.message
    });
  }
};

// Get registration by ID
exports.getRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await Registration.findById(id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: registration
    });

  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registration',
      error: error.message
    });
  }
};

function getEmojiForCategory(category) {
  const emojis = {
    foreigner: '🧘‍♀️',
    indian: '🇮🇳',
    student: '🎓'
  };
  return emojis[category] || '👤';
}

function formatPrice(price, currency) {
  if (currency === 'USD') {
    return `$${price} USD`;
  } else if (currency === 'INR') {
    return `₹${price.toLocaleString('en-IN')}`;
  }
  return `${price} ${currency}`;
}

initializeSeats();