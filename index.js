const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/auth', require('./routes/auth'));
app.use('/rooms', require('./routes/rooms'));
app.use('/bookings', require('./routes/bookings'));
app.use('/admins', require('./routes/admins'));

//userRoutes

app.use('/user', require('./userRoutes/bookingRoutes'))
app.use('/user', require('./userRoutes/roomBooking'))
app.use('/user', require('./userRoutes/auth'))

app.use('/registrations', require('./routes/registration'));

app.use('/donations', require('./routes/donations'));
app.use('/payments', require('./routes/payments'));

const PORT = process.env.PORT || 5000;
const { dbConnect } = require('./config/db');
dbConnect();

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });