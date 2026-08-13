/**
 * smsSender.js
 *
 * Internal SMS utility for OpenBazar.
 * In development / when no SMS provider is configured, OTPs are logged to console.
 * To plug in a real provider (e.g. Twilio, Bangladesh SMSBD, Infobip, etc.):
 *   1. Install their SDK
 *   2. Set the env vars listed below
 *   3. Replace the stub inside `sendSmsViaProvider`
 *
 * Env vars (all optional — fallback to console logging):
 *   SMS_PROVIDER   — 'console' (default) | 'twilio' | 'custom'
 *   SMS_FROM       — Sender number / alphanumeric sender ID
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN  — for Twilio
 */

const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'console').toLowerCase();

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
 * Accepts: 01[3-9]XXXXXXXX  (11 digits)
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
      // npm i twilio  →  set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + SMS_FROM
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ body: message, from: process.env.SMS_FROM, to });
      break;
    }

    case 'console':
    default:
      // Development fallback — print to server logs so you can verify the OTP
      console.log(`\n📱 [SMS — DEV CONSOLE] To: ${to}\n   Message: ${message}\n`);
      break;
  }
}

/**
 * Send a phone OTP.
 * @param {string} phone  – raw Bangladesh phone (01XXXXXXXXX)
 * @param {string} otp    – 6-digit OTP string  ← NEVER exposed to clients
 */
async function sendPhoneOtp(phone, otp) {
  if (!isValidBdPhone(phone)) {
    throw new Error('Invalid Bangladesh phone number format.');
  }
  const normalized = normalizeBdPhone(phone);
  const maskedPhone = `+880••••••${phone.slice(-2)}`; // for safe client display
  const message = `Your OpenBazar verification code is: ${otp}. Valid for 10 minutes. Do not share it.`;

  await sendSmsViaProvider(normalized, message);
  return { normalized, maskedPhone };
}

module.exports = { sendPhoneOtp, normalizeBdPhone, isValidBdPhone };
