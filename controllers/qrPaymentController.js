const QrPayment = require('../models/QrPayment');
const SeatAvailability = require('../models/SeatAvailability');
const { sendPaymentSubmissionEmail, sendEventPassEmail, sendVerificationStatusEmail } = require('../utils/emailEventPass');

exports.createQrPayment = async (req, res) => {
    try {
        const { fullName, email, country, phone, category } = req.body;

        const amountMap = {
            foreigner: { amount: 500, currency: 'USD' },
            indian: { amount: 21000, currency: 'INR' },
            student: { amount: 11000, currency: 'INR' }
        };

        const amountInfo = amountMap[category];
        if (!amountInfo) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        const qrPayment = new QrPayment({
            fullName,
            email,
            country,
            phone,
            category,
            amount: amountInfo.amount,
            currency: amountInfo.currency,
            status: 'pending'
        });

        await qrPayment.save();

        res.status(201).json({
            success: true,
            message: 'Registration created successfully',
            data: {
                id: qrPayment._id,
                transactionId: qrPayment.transactionId,
                amount: qrPayment.amount,
                currency: qrPayment.currency
            }
        });

    } catch (error) {
        console.error('QR Payment creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

exports.uploadScreenshot = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Screenshot file is required'
            });
        }

        const qrPayment = await QrPayment.findOne({transactionId: id});
        if (!qrPayment) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        qrPayment.screenshot = {
            public_id: req.file.public_id,
            url: req.file.path
        };
        qrPayment.status = 'pending'; 

        await qrPayment.save();

        await sendPaymentSubmissionEmail(qrPayment);

        res.json({
            success: true,
            message: 'Screenshot uploaded successfully. Payment is under verification.',
            data: qrPayment
        });

    } catch (error) {
        console.error('Screenshot upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading screenshot'
        });
    }
};

exports.trackPayment = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID is required'
            });
        }

        const payment = await QrPayment.findOne({ transactionId })
            .select('-screenshot.public_id -adminNotes -__v');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'No registration found with this Transaction ID'
            });
        }

        const responseData = {
            _id: payment._id,
            fullName: payment.fullName,
            email: payment.email,
            category: payment.category,
            amount: payment.amount,
            currency: payment.currency,
            transactionId: payment.transactionId,
            status: payment.status,
            eventPassSent: payment.eventPassSent,
            eventPassCode: payment.eventPassSent ? payment.eventPassCode : null,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt
        };

        if (responseData.email) {
            const [localPart, domain] = responseData.email.split('@');
            const maskedLocal = localPart.substring(0, 3) + '***';
            responseData.email = `${maskedLocal}@${domain}`;
        }

        res.json({
            success: true,
            message: 'Payment details found',
            data: responseData
        });

    } catch (error) {
        console.error('Track payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error tracking payment'
        });
    }
};

exports.getAllQrPayments = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const payments = await QrPayment.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await QrPayment.countDocuments(query);

        res.json({
            success: true,
            data: payments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPayments: total
            }
        });

    } catch (error) {
        console.error('Get QR payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments'
        });
    }
};

exports.getQrPayment = async (req, res) => {
    try {
        const payment = await QrPayment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: payment
        });

    } catch (error) {
        console.error('Get QR payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment'
        });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const payment = await QrPayment.findById(id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const previousStatus = payment.status;

        payment.status = status;
        if (adminNotes) {
            payment.adminNotes = adminNotes;
        }

        await payment.save();

        if (status === 'verified' && previousStatus !== 'verified') {
            const seatAvailability = await SeatAvailability.findOne({ 
                category: payment.category.toLowerCase() 
            });

            if (seatAvailability) {
                if (seatAvailability.hasAvailableSeats(1)) {
                    await seatAvailability.bookSeats(1);
                    console.log(`Seat booked for ${payment.category} category`);
                } else {
                    console.warn(`No seats available for ${payment.category} category`);
                }
            }
        } else if (status === 'rejected' && previousStatus === 'verified') {
            const seatAvailability = await SeatAvailability.findOne({ 
                category: payment.category.toLowerCase() 
            });

            if (seatAvailability) {
                await seatAvailability.releaseSeats(1);
                console.log(`Seat released for ${payment.category} category`);
            }
        }

        await sendVerificationStatusEmail(payment, status, adminNotes);

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: payment
        });

    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment status'
        });
    }
};

exports.sendEventPass = async (req, res) => {
    try {
        const { id } = req.params;
        const { passCode } = req.body;

        const payment = await QrPayment.findById(id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status !== 'verified') {
            return res.status(400).json({
                success: false,
                message: 'Can only send pass for verified payments'
            });
        }

        payment.eventPassSent = true;
        payment.eventPassCode = passCode || `PASS${Date.now().toString().slice(-6)}`;
        payment.status = 'completed';

        await payment.save();

        await sendEventPassEmail(payment);

        res.json({
            success: true,
            message: 'Event pass sent successfully',
            data: payment
        });

    } catch (error) {
        console.error('Send event pass error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending event pass'
        });
    }
};

exports.getQrPaymentStats = async (req, res) => {
    try {
        const stats = await QrPayment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const total = await QrPayment.countDocuments();
        const totalAmount = await QrPayment.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                byStatus: stats,
                totalRegistrations: total,
                totalRevenue: totalAmount[0]?.total || 0
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stats'
        });
    }
};