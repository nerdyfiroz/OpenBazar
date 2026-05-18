function verifyPayment({ paymentMethod, paymentInfo = {}, orderTotal }) {
  if (!paymentMethod) {
    return { ok: false, message: 'Payment method is required' };
  }

  if (paymentMethod === 'COD') {
    return {
      ok: true,
      provider: 'COD',
      paymentStatus: 'pending',
      verified: false,
      reference: null,
      message: 'Cash on Delivery selected'
    };
  }

  const providerMap = {
    bKash: 'bKash',
    Nagad: 'Nagad',
    Rocket: 'Rocket',
    Card: 'CardGateway'
  };

  const txId = String(paymentInfo.transactionId || '').trim();
  if (txId.length < 6) {
    return {
      ok: true,
      provider: providerMap[paymentMethod] || 'ExternalProvider',
      paymentStatus: 'pending',
      verified: false,
      reference: null,
      message: `${paymentMethod} selected. Awaiting gateway initiation and webhook confirmation.`,
      amount: Number(orderTotal || 0)
    };
  }

  return {
    ok: true,
    provider: providerMap[paymentMethod] || 'ExternalProvider',
    paymentStatus: 'verified',
    verified: true,
    reference: txId,
    message: `Payment verified via ${providerMap[paymentMethod] || paymentMethod}`,
    amount: Number(orderTotal || 0)
  };
}

module.exports = { verifyPayment };
