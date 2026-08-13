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
async function sendSmsViaProvider(to, message, rawPhone) {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();

  // 1. Greenweb BD Gateway (Very cheap BD SMS Gateway)
  if (provider === 'greenweb' || process.env.GREENWEB_API_TOKEN) {
    const token = process.env.GREENWEB_API_TOKEN;
    if (token) {
      const url = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(token)}&to=${encodeURIComponent(rawPhone)}&message=${encodeURIComponent(message)}`;
      const res = await fetch(url);
      const text = await res.text();
      console.log(`[Greenweb SMS] Sent to ${rawPhone}: ${text}`);
      return;
    }
  }

  // 2. BulkSMS BD Gateway (bd.bulksms.com / bulksmsbd.net)
  if (provider === 'bulksmsbd' || process.env.BULKSMSBD_API_KEY) {
    const apiKey = process.env.BULKSMSBD_API_KEY;
    const senderId = process.env.BULKSMSBD_SENDER_ID || '8809612737373';
    if (apiKey) {
      const url = `http://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(apiKey)}&type=text&number=${encodeURIComponent(rawPhone)}&senderid=${encodeURIComponent(senderId)}&message=${encodeURIComponent(message)}`;
      const res = await fetch(url);
      const text = await res.text();
      console.log(`[BulkSMS BD] Sent to ${rawPhone}: ${text}`);
      return;
    }
  }

  // 3. Twilio Gateway
  if (provider === 'twilio' || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)) {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({ body: message, from: process.env.SMS_FROM, to });
    console.log(`[Twilio SMS] Sent to ${to}`);
    return;
  }

  // 4. Default Console Log (When no gateway API key is configured in env)
  console.log(`\n📱 [SMS GATEWAY LOG] To: ${to} (${rawPhone})\n   Message: ${message}\n`);
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

  await sendSmsViaProvider(normalized, message, phone);

  return {
    normalized,
    maskedPhone
  };
}

module.exports = { sendPhoneOtp, normalizeBdPhone, isValidBdPhone, SMS_PROVIDER };

