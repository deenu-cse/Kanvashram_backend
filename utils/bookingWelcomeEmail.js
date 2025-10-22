const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail({ to, guestName, roomName, checkIn, checkOut, totalPrice, bookingId }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@gurukulkanvashram.com>',
      to,
      subject: `Welcome to Our Ashram - Booking Confirmation`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .booking-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Our Spiritual Ashram</h1>
                </div>
                <div class="content">
                    <h2>Dear ${guestName},</h2>
                    <p>We are delighted to confirm your booking at our ashram. Your spiritual journey awaits!</p>
                    
                    <div class="booking-details">
                        <h3>Booking Details:</h3>
                        <p><strong>Booking ID:</strong> ${bookingId}</p>
                        <p><strong>Room:</strong> ${roomName}</p>
                        <p><strong>Check-in:</strong> ${checkIn}</p>
                        <p><strong>Check-out:</strong> ${checkOut}</p>
                        <p><strong>Total Amount:</strong> ₹${totalPrice}</p>
                    </div>

                    <h3>What to Expect:</h3>
                    <ul>
                        <li>Peaceful and serene environment</li>
                        <li>Daily yoga and meditation sessions</li>
                        <li>Healthy vegetarian meals</li>
                        <li>Spiritual guidance and activities</li>
                    </ul>

                    <h3>Important Information:</h3>
                    <ul>
                        <li>Check-in time: 12:00 PM</li>
                        <li>Check-out time: 11:00 AM</li>
                        <li>Please carry valid ID proof</li>
                        <li>Dress modestly as per ashram traditions</li>
                    </ul>

                    <p>We look forward to welcoming you and supporting your spiritual journey.</p>
                    
                    <p>With blessings,<br>The Ashram Team</p>
                </div>
                <div class="footer">
                    <p>For any queries, contact us at: support@your-ashram-domain.com</p>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}