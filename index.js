const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const serverless = require('serverless-http');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/rooms', require('./routes/rooms'));
app.use('/bookings', require('./routes/bookings'));
app.use('/admins', require('./routes/admins'));
app.use('/user', require('./userRoutes/bookingRoutes'));
app.use('/user', require('./userRoutes/roomBooking'));
app.use('/user', require('./userRoutes/auth'));
app.use('/registrations', require('./routes/registration'));
app.use('/donations', require('./routes/donations'));
app.use('/payments', require('./routes/payments'));

// Instead of app.listen(), export the handler
module.exports = app;
module.exports.handler = serverless(app);
