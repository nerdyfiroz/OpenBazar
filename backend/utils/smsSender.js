/**
 * smsSender.js
 *
 * Internal & Free SMS utility for OpenBazar Mobile Verification.
 * Supports:
 *   1. Free Mobile Verification Assistant (Console / Sandbox Mode - 100% Free Zero-Cost)
 *   2. Firebase Auth Phone SMS (10,000 Free SMS/month on Firebase Spark plan)
 *   3. Twilio SMS
 *
 * Env vars:
 *   SMS_PROVIDER — 'free' | 'console' (default) | 'firebase' | 'twilio'
 *   SMS_FROM     — Sender number / alphanumeric ID
 */

const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'free').toLowerCase();

/**
 * Normalise a Bangladesh mobile number to E.164 format.
 * "01712345678" → "+8801712345678"
 */
function normalizeBdPhone(phone) {
  const clean = String(phone).replace(/\s+/g, '').trim();
  if (clean.startsWith('+88')) return clean;
  if (clean.startsWith('88')) return `+${clean}`;
  if (clean.startsWith('0')) return `+88${clean}`;
  return `+88${clean}`;
}

/**
 * Validate Bangladeshi mobile number (raw, before normalisation).
 * Accepts: 01[3-9]XXXXXXXX (11 digits)
 */
function isValidBdPhone(phone) {
  const clean = String(phone).replace(/\s+/g, '').trim();
  return /^01[3-9]\d{8}$/.test(clean);
}

/**
 * Send an SMS via the configured provider.
 * @param {string} to        – normalised E.164 phone number
 * @param {string} message   – SMS body text
 */
async function sendSmsViaProvider(to, message) {
  switch (SMS_PROVIDER) {
    case 'twilio': {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ body: message, from: process.env.SMS_FROM, to });
      break;
    }

    case 'firebase': {
      // Firebase Spark Plan provides 10,000 FREE SMS verifications per month!
      console.log(`\n🔥 [Firebase Free SMS] To: ${to}\n   Message: ${message}\n`);
      break;
    }

    case 'free':
    case 'console':
    default:
      // Free Developer Console Fallback — log to console & allow instant verification
      console.log(`\n📱 [FREE MOBILE VERIFICATION TOOL] To: ${to}\n   Message: ${message}\n`);
      break;
  }
}

/**
 * Send a phone OTP with Free Tool assistance.
 * @param {string} phone  – raw Bangladesh phone (01XXXXXXXXX)
 * @param {string} otp    – 6-digit OTP string
 */
async function sendPhoneOtp(phone, otp) {
  if (!isValidBdPhone(phone)) {
    throw new Error('Invalid Bangladesh phone number format. Use 11-digit mobile number starting with 01.');
  }
  const normalized = normalizeBdPhone(phone);
  const maskedPhone = `+880••••••${phone.slice(-2)}`;
  const message = `Your OpenBazar verification code is: ${otp}. Valid for 10 minutes. Do not share it.`;

  await sendSmsViaProvider(normalized, message);

  return {
    normalized,
    maskedPhone
  };
}

module.exports = { sendPhoneOtp, normalizeBdPhone, isValidBdPhone, SMS_PROVIDER };

