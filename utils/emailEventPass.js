const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Send payment submission confirmation
exports.sendPaymentSubmissionEmail = async (payment) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Spiritual Retreat <noreply@gurukulkanvashram.com>',
      to: payment.email,
      subject: 'Payment Submission Received - Spiritual Retreat',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #6d28d9, #8b5cf6); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0;
            }
            .content { 
              padding: 30px; 
              background: #f9f9f9; 
              border-radius: 0 0 10px 10px;
            }
            .booking-details { 
              background: white; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border-left: 4px solid #6d28d9;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              font-size: 12px; 
              color: #666; 
              margin-top: 20px;
            }
            .status-pending {
              background: #fff3cd;
              color: #856404;
              padding: 8px 15px;
              border-radius: 20px;
              font-weight: bold;
              display: inline-block;
            }
            .highlight {
              background: #6d28d9;
              color: white;
              padding: 10px 15px;
              border-radius: 5px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Submission Received</h1>
              <p>Spiritual Retreat Registration</p>
            </div>
            <div class="content">
              <h2>Dear ${payment.fullName},</h2>
              <p>Thank you for submitting your payment screenshot for the Spiritual Retreat. We have received your payment proof and it is now under verification.</p>
              
              <div class="booking-details">
                <h3 style="color: #6d28d9; margin-top: 0;">Registration Details:</h3>
                <p><strong>Transaction ID:</strong> <span class="highlight">${payment.transactionId}</span></p>
                <p><strong>Full Name:</strong> ${payment.fullName}</p>
                <p><strong>Email:</strong> ${payment.email}</p>
                <p><strong>Phone:</strong> ${payment.phone}</p>
                <p><strong>Category:</strong> ${payment.category.charAt(0).toUpperCase() + payment.category.slice(1)}</p>
                <p><strong>Amount Paid:</strong> ${payment.currency === 'USD' ? '$' : '₹'}${payment.amount}</p>
                <p><strong>Current Status:</strong> <span class="status-pending">Under Verification</span></p>
              </div>

              <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #1e40af;">What happens next?</h4>
                <ul>
                  <li>Our team will verify your payment within <strong>24-48 hours</strong></li>
                  <li>You will receive another email once your payment is verified</li>
                  <li>After verification, your event pass will be sent to this email</li>
                </ul>
              </div>

              <p><strong>Important:</strong> Please keep this transaction ID safe for future reference.</p>
              
              <p>If you have any questions or need assistance, please contact us at:</p>
              <p style="text-align: center;">
                <strong>Email:</strong> support@gurukulkanvashram.com<br>
                <strong>Phone:</strong> [Your Support Phone Number]
              </p>

              <p>We look forward to welcoming you to this transformative spiritual journey!</p>
              
              <br>
              <p>With divine blessings,<br>
              <strong>Spiritual Retreat Team</strong><br>
              Gurukul Kanvashram</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>© ${new Date().getFullYear()} Spiritual Retreat - Gurukul Kanvashram. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    
    console.log('Payment submission email sent to:', payment.email);
    return data;
    
  } catch (error) {
    console.error('Error sending payment submission email:', error);
    throw error;
  }
};

// Send event pass email
exports.sendEventPassEmail = async (payment) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Spiritual Retreat <noreply@gurukulkanvashram.com>',
      to: payment.email,
      subject: '🎉 Your Event Pass - Spiritual Retreat Confirmation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #6d28d9, #8b5cf6); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0;
            }
            .content { 
              padding: 30px; 
              background: #f9f9f9; 
              border-radius: 0 0 10px 10px;
            }
            .event-pass { 
              background: linear-gradient(135deg, #6d28d9, #8b5cf6); 
              color: white; 
              padding: 30px; 
              border-radius: 10px; 
              text-align: center; 
              margin: 25px 0;
              box-shadow: 0 4px 15px rgba(109, 40, 217, 0.3);
            }
            .pass-code {
              background: white; 
              color: #6d28d9; 
              padding: 20px; 
              border-radius: 8px; 
              font-size: 32px; 
              font-weight: bold; 
              letter-spacing: 4px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            }
            .booking-details { 
              background: white; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border-left: 4px solid #10b981;
            }
            .instructions { 
              background: #f0f9ff; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-left: 4px solid #0ea5e9;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              font-size: 12px; 
              color: #666; 
              margin-top: 20px;
            }
            .highlight {
              background: #10b981;
              color: white;
              padding: 8px 15px;
              border-radius: 20px;
              font-weight: bold;
              display: inline-block;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="font-size: 36px; margin: 0 0 10px 0;">🎉 Welcome to Spiritual Retreat!</h1>
              <p style="font-size: 18px; margin: 0; opacity: 0.9;">Your Registration is Confirmed</p>
            </div>
            <div class="content">
              <h2>Dear ${payment.fullName},</h2>
              <p>We are thrilled to inform you that your payment has been verified successfully! We're excited to have you join us for this transformative spiritual journey.</p>
              
              <div class="event-pass">
                <h3 style="margin: 0 0 20px 0; font-size: 24px;">YOUR EVENT PASS</h3>
                <p style="font-size: 18px; margin: 10px 0;"><strong>Pass Code:</strong></p>
                <div class="pass-code">
                  ${payment.eventPassCode}
                </div>
                <p style="margin: 15px 0 0 0; font-size: 16px;">
                  <strong>🔒 Keep this code safe - you'll need it for entry!</strong>
                </p>
              </div>

              <div class="booking-details">
                <h3 style="color: #10b981; margin-top: 0;">Event & Registration Details:</h3>
                <p><strong>Event:</strong> 7-Day Spiritual Retreat</p>
                <p><strong>Full Name:</strong> ${payment.fullName}</p>
                <p><strong>Email:</strong> ${payment.email}</p>
                <p><strong>Category:</strong> ${payment.category.charAt(0).toUpperCase() + payment.category.slice(1)}</p>
                <p><strong>Transaction ID:</strong> <strong>${payment.transactionId}</strong></p>
                <p><strong>Amount Paid:</strong> ${payment.currency === 'USD' ? '$' : '₹'}${payment.amount}</p>
                <p><strong>Registration Status:</strong> <span class="highlight">Confirmed & Verified</span></p>
              </div>

              <div class="instructions">
                <h4 style="color: #0ea5e9; margin-top: 0;">📋 Important Instructions for Event Day:</h4>
                <ul style="margin: 15px 0; padding-left: 20px;">
                  <li><strong>Bring a valid government-issued ID proof</strong> for verification</li>
                  <li>Keep this email accessible on your phone or bring a printed copy</li>
                  <li>Arrive <strong>30 minutes before</strong> the event start time</li>
                  <li>Carry essential personal items and comfortable clothing</li>
                  <li>Inform us in advance about any dietary restrictions or medical conditions</li>
                </ul>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="color: #d97706; margin-top: 0;">📍 Event Venue Details:</h4>
                <p><strong>Location:</strong> Gurukul Kanvashram, [Full Address]</p>
                <p><strong>Date:</strong> [Event Start Date] to [Event End Date]</p>
                <p><strong>Time:</strong> [Event Start Time] onwards</p>
                <p><strong>Google Maps:</strong> <a href="[Google Maps Link]" style="color: #6d28d9;">View on Google Maps</a></p>
              </div>

              <p style="text-align: center; font-size: 16px;">
                <strong>Need assistance?</strong><br>
                Email: support@gurukulkanvashram.com<br>
                Phone: [Your Support Phone Number]
              </p>

              <p>We are truly looking forward to sharing this beautiful spiritual experience with you!</p>
              
              <br>
              <p>With divine grace and blessings,<br>
              <strong>Spiritual Retreat Team</strong><br>
              Gurukul Kanvashram</p>
            </div>
            <div class="footer">
              <p>This is an automated confirmation email. Please do not reply to this message.</p>
              <p>© ${new Date().getFullYear()} Spiritual Retreat - Gurukul Kanvashram. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    
    console.log('Event pass email sent to:', payment.email);
    return data;
    
  } catch (error) {
    console.error('Error sending event pass email:', error);
    throw error;
  }
};

// Send payment verification status update
exports.sendVerificationStatusEmail = async (payment, status, adminNotes = '') => {
  try {
    const statusConfig = {
      verified: {
        subject: '✅ Payment Verified - Spiritual Retreat',
        title: 'Payment Verified Successfully',
        message: 'Your payment has been verified and your registration is now confirmed!',
        color: '#10b981'
      },
      rejected: {
        subject: '❌ Payment Verification Issue - Spiritual Retreat',
        title: 'Payment Verification Required',
        message: 'We encountered an issue with your payment verification. Please see the notes below.',
        color: '#ef4444'
      }
    };

    const config = statusConfig[status] || statusConfig.verified;

    const { data, error } = await resend.emails.send({
      from: 'Spiritual Retreat <noreply@gurukulkanvashram.com>',
      to: payment.email,
      subject: config.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${config.color}, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color}; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.title}</h1>
            </div>
            <div class="content">
              <h2>Dear ${payment.fullName},</h2>
              <p>${config.message}</p>
              
              <div class="status-box">
                <h3 style="color: ${config.color}; margin-top: 0;">Payment Status Update:</h3>
                <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
                <p><strong>Status:</strong> <span style="color: ${config.color}; font-weight: bold;">${status.toUpperCase()}</span></p>
                <p><strong>Amount:</strong> ${payment.currency === 'USD' ? '$' : '₹'}${payment.amount}</p>
                ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
              </div>

              ${status === 'verified' ? `
                <p>Your event pass will be sent to you separately within the next 24 hours.</p>
              ` : `
                <p>Please contact our support team to resolve this issue and complete your registration.</p>
              `}

              <p style="text-align: center;">
                <strong>Contact Support:</strong><br>
                Email: support@gurukulkanvashram.com<br>
                Phone: [Your Support Phone Number]
              </p>

              <br>
              <p>Best regards,<br><strong>Spiritual Retreat Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Spiritual Retreat - Gurukul Kanvashram</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    
    console.log(`Verification status email (${status}) sent to:`, payment.email);
    return data;
    
  } catch (error) {
    console.error('Error sending verification status email:', error);
    throw error;
  }
};