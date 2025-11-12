const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Send OTP email for password reset
exports.sendPasswordResetOTP = async (admin, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Spiritual Retreat <noreply@gurukulkanvashram.com>',
      to: admin.email,
      subject: '🔐 Password Reset OTP - Admin Dashboard',
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
            .otp-box { 
              background: linear-gradient(135deg, #6d28d9, #8b5cf6); 
              color: white; 
              padding: 30px; 
              border-radius: 10px; 
              text-align: center; 
              margin: 25px 0;
              box-shadow: 0 4px 15px rgba(109, 40, 217, 0.3);
            }
            .otp-code {
              background: white; 
              color: #6d28d9; 
              padding: 20px; 
              border-radius: 8px; 
              font-size: 36px; 
              font-weight: bold; 
              letter-spacing: 8px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
              display: inline-block;
            }
            .warning-box { 
              background: #fff3cd; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-left: 4px solid #ffc107;
            }
            .info-box { 
              background: #e7f3ff; 
              padding: 15px; 
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="font-size: 32px; margin: 0 0 10px 0;">🔐 Password Reset Request</h1>
              <p style="font-size: 16px; margin: 0; opacity: 0.9;">Admin Dashboard</p>
            </div>
            <div class="content">
              <h2>Dear ${admin.name},</h2>
              <p>We received a request to reset your password for the Admin Dashboard. Please use the OTP (One-Time Password) below to verify your identity and reset your password.</p>
              
              <div class="otp-box">
                <h3 style="margin: 0 0 20px 0; font-size: 20px;">Your Password Reset OTP</h3>
                <div class="otp-code">
                  ${otp}
                </div>
                <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.9;">
                  This OTP is valid for <strong>10 minutes</strong>
                </p>
              </div>

              <div class="warning-box">
                <h4 style="margin-top: 0; color: #856404;">⚠️ Security Notice:</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Never share this OTP with anyone</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>The OTP will expire in 10 minutes for security reasons</li>
                </ul>
              </div>

              <div class="info-box">
                <h4 style="margin-top: 0; color: #0c4a6e;">📋 Next Steps:</h4>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Enter this OTP in the password reset form</li>
                  <li>Verify the OTP</li>
                  <li>Set your new password</li>
                </ol>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <strong>Need help?</strong><br>
                Email: support@gurukulkanvashram.com
              </p>

              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <br>
              <p>Best regards,<br>
              <strong>Admin Dashboard Team</strong><br>
              Gurukul Kanvashram</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>© ${new Date().getFullYear()} Gurukul Kanvashram. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    
    console.log('Password reset OTP email sent to:', admin.email);
    return data;
    
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    throw error;
  }
};

