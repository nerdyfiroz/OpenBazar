const { Resend } = require('resend');

let resendClient = null;

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
};

/**
 * Send an HTML email via Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email Subject
 * @param {string} htmlContent - HTML String for Body
 */
const sendEmail = async (to, subject, htmlContent) => {
  const resend = getResendClient();

  if (!resend) {
    console.error('[Email Error] Missing RESEND_API_KEY in environment.');
    return false;
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'OpenBazar <noreply@resend.dev>';
    const { data, error } = await resend.emails.send({
      from: fromEmail,
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
 * @param {string} verificationLink - One-time verification link
 */
const generateOTPTemplate = (OTP, verificationLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
    <h2 style="color: #f97316; text-align: center;">OpenBazar</h2>
    <p style="font-size: 16px; color: #333;">Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; background: #fff7ed; padding: 10px 20px; border-radius: 5px; color: #ea580c; border: 1px solid #fed7aa; letter-spacing: 5px;">
        ${OTP}
      </span>
    </div>
    <p style="color: #666; font-size: 14px;">This code will expire in <strong>5 minutes</strong>. Do not share this code with anyone.</p>
    ${verificationLink ? `
      <div style="text-align:center; margin: 24px 0;">
        <a href="${verificationLink}" style="display:inline-block; background:#f97316; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:600;">
          Verify Email Instantly
        </a>
      </div>
      <p style="color:#666; font-size:13px;">This one-time verification link also expires in 5 minutes.</p>
    ` : ''}
    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
    <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request this code, please ignore this email.</p>
  </div>
`;

module.exports = { sendEmail, generateOTPTemplate };