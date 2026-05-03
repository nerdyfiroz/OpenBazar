const crypto = require('crypto');

function signPayload({ payload, timestamp, secret }) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
  return crypto
    .createHmac('sha256', String(secret || ''))
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

function safeEqualHex(a, b) {
  const left = Buffer.from(String(a || ''), 'hex');
  const right = Buffer.from(String(b || ''), 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifySignedPayload({ payload, timestamp, signature, secret, toleranceSeconds = 300 }) {
  if (!timestamp || !signature || !secret) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) return false;

  const expected = signPayload({ payload, timestamp: String(timestamp), secret });
  return safeEqualHex(expected, signature);
}

module.exports = {
  signPayload,
  verifySignedPayload
};
