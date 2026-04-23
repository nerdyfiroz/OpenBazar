const { Resend } = require('resend');

// Requires RESEND_API_KEY environment variable set on your hosting provider
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an HTML email via Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email Subject
 * @param {string} htmlContent - HTML String for Body
 */
const sendEmail = async (to, subject, htmlContent) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email Error] Missing RESEND_API_KEY in environment.');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'OpenBazar <noreply@YOUR_VERIFIED_DOMAIN.com>', // Change this to your verified Resend Domain (e.g. noreply@open-bazar.me)
      to,
      subject,
      html: htmlContent
    });

    if (error) {
      console.error('[Email Error] Resend failed:', error);
      return false;
    }
    
    console.log(`[Email Sent] Successfully sent to ${to} (ID: ${data.id})`);
    return true;
  } catch (err) {
    console.error('[Email Error] Exception sending email:', err);
    return false;
  }
};

/**
 * Generate a modern OTP email template
 * @param {string} OTP - The 6 digit code
 */
const generateOTPTemplate = (OTP) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
    <h2 style="color: #f97316; text-align: center;">OpenBazar</h2>
    <p style="font-size: 16px; color: #333;">Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; background: #fff7ed; padding: 10px 20px; border-radius: 5px; color: #ea580c; border: 1px solid #fed7aa; letter-spacing: 5px;">
        ${OTP}
      </span>
    </div>
    <p style="color: #666; font-size: 14px;">This code will expire in <strong>5 minutes</strong>. Do not share this code with anyone.</p>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
    <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request this code, please ignore this email.</p>
  </div>
`;

module.exports = { sendEmail, generateOTPTemplate };