function mapProvider(provider) {
  if (provider === 'bKash') {
    return {
      key: process.env.BKASH_API_KEY,
      secret: process.env.BKASH_API_SECRET,
      endpoint: process.env.BKASH_PAYMENT_URL,
      returnUrl: process.env.BKASH_RETURN_URL
    };
  }

  if (provider === 'Nagad') {
    return {
      key: process.env.NAGAD_API_KEY,
      secret: process.env.NAGAD_API_SECRET,
      endpoint: process.env.NAGAD_PAYMENT_URL,
      returnUrl: process.env.NAGAD_RETURN_URL
    };
  }

  return {
    key: process.env.CARD_API_KEY,
    secret: process.env.CARD_API_SECRET,
    endpoint: process.env.CARD_PAYMENT_URL,
    returnUrl: process.env.CARD_RETURN_URL
  };
}

function normalizeStatus(raw) {
  const value = String(raw || '').toLowerCase();
  if (['success', 'succeeded', 'completed', 'paid', 'verified'].includes(value)) return 'succeeded';
  if (['failed', 'cancelled', 'canceled', 'declined'].includes(value)) return 'failed';
  return 'pending';
}

async function initiateProviderPayment({ provider, order, idempotencyKey, callbackUrl }) {
  const cfg = mapProvider(provider);
  const externalPaymentId = `${provider.toLowerCase()}_${order._id}_${Date.now()}`;

  const payload = {
    amount: Number(order.total || 0),
    currency: 'BDT',
    orderId: String(order._id),
    reference: externalPaymentId,
    callbackUrl,
    returnUrl: cfg.returnUrl || null,
    idempotencyKey
  };

  if (!cfg.endpoint || !cfg.key || !cfg.secret) {
    return {
      ok: true,
      externalPaymentId,
      paymentUrl: `https://sandbox.openbazar.local/pay/${provider.toLowerCase()}/${externalPaymentId}`,
      raw: {
        provider,
        simulated: true,
        message: 'Provider credentials missing. Returned sandbox payment URL.',
        payload
      }
    };
  }

  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.key}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: data.message || `${provider} initiation failed`,
      raw: data
    };
  }

  return {
    ok: true,
    externalPaymentId: data.paymentId || data.reference || externalPaymentId,
    paymentUrl: data.paymentUrl || data.redirectUrl || null,
    raw: data
  };
}

function extractWebhookData(payload = {}, provider) {
  const externalPaymentId = payload.paymentId
    || payload.reference
    || payload.transactionId
    || payload.trxID
    || payload?.data?.paymentId
    || null;

  const eventId = payload.eventId
    || payload.id
    || payload.webhookId
    || payload.callbackId
    || null;

  const status = normalizeStatus(payload.status || payload.paymentStatus || payload.transactionStatus);

  return {
    provider,
    eventId,
    externalPaymentId,
    status,
    amount: Number(payload.amount || payload?.data?.amount || 0),
    reference: payload.reference || payload.transactionId || payload.trxID || externalPaymentId || null
  };
}

module.exports = {
  initiateProviderPayment,
  extractWebhookData
};
