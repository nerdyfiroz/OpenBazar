const crypto = require('crypto');
const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');
const PaymentWebhookEvent = require('../models/PaymentWebhookEvent');
const { initiateProviderPayment, extractWebhookData } = require('../services/providerConnectors');
const { verifySignedPayload } = require('../utils/signature');

const SUPPORTED_PROVIDERS = ['bKash', 'Nagad', 'Card'];

function requestHash(input) {
  return crypto.createHash('sha256').update(JSON.stringify(input || {})).digest('hex');
}

function providerSecret(provider) {
  if (provider === 'bKash') return process.env.BKASH_WEBHOOK_SECRET;
  if (provider === 'Nagad') return process.env.NAGAD_WEBHOOK_SECRET;
  return process.env.CARD_WEBHOOK_SECRET;
}

function providerFromPath(pathProvider) {
  const normalized = String(pathProvider || '').toLowerCase();
  if (normalized === 'bkash') return 'bKash';
  if (normalized === 'nagad') return 'Nagad';
  if (normalized === 'card') return 'Card';
  return null;
}

exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, provider } = req.body;
    const normalizedProvider = providerFromPath(provider);

    if (!normalizedProvider || !SUPPORTED_PROVIDERS.includes(normalizedProvider)) {
      return res.status(400).json({ message: 'Unsupported payment provider' });
    }

    const idempotencyKey = String(req.header('Idempotency-Key') || req.body.idempotencyKey || '').trim();
    if (!idempotencyKey) {
      return res.status(400).json({ message: 'Idempotency-Key is required' });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.isPaid) {
      return res.json({
        message: 'Order is already paid',
        alreadyPaid: true,
        orderId: order._id,
        paymentReference: order.paymentInfo?.paymentReference || null
      });
    }

    const reqHash = requestHash({ orderId: String(order._id), provider: normalizedProvider });

    const existing = await PaymentTransaction.findOne({ user: req.user._id, idempotencyKey });
    if (existing) {
      if (String(existing.order) !== String(order._id) || existing.provider !== normalizedProvider) {
        return res.status(409).json({ message: 'Idempotency key conflict for different request payload' });
      }

      return res.json({
        idempotentReplay: true,
        transactionId: existing._id,
        ...existing.responseSnapshot
      });
    }

    const apiBase = process.env.API_BASE_URL || 'http://localhost:5000';
    const callbackUrl = `${apiBase}/api/payments/webhook/${normalizedProvider.toLowerCase()}`;

    const initResult = await initiateProviderPayment({
      provider: normalizedProvider,
      order,
      idempotencyKey,
      callbackUrl
    });

    if (!initResult.ok) {
      return res.status(400).json({ message: initResult.message || 'Payment initiation failed', details: initResult.raw });
    }

    const responseSnapshot = {
      message: 'Payment initiated',
      orderId: order._id,
      provider: normalizedProvider,
      externalPaymentId: initResult.externalPaymentId,
      paymentUrl: initResult.paymentUrl,
      amount: order.total
    };

    const tx = await PaymentTransaction.create({
      order: order._id,
      user: req.user._id,
      provider: normalizedProvider,
      idempotencyKey,
      requestHash: reqHash,
      externalPaymentId: initResult.externalPaymentId,
      amount: order.total,
      status: 'pending',
      paymentUrl: initResult.paymentUrl,
      responseSnapshot,
      updatedAt: new Date()
    });

    order.paymentMethod = normalizedProvider;
    order.paymentInfo = {
      ...(order.paymentInfo || {}),
      provider: normalizedProvider,
      paymentReference: initResult.externalPaymentId,
      paymentStatus: 'pending'
    };
    order.statusHistory.push({
      status: order.status,
      note: `Payment initiated via ${normalizedProvider}`,
      changedBy: req.user._id
    });
    await order.save();

    return res.status(201).json({ transactionId: tx._id, ...responseSnapshot });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const provider = providerFromPath(req.params.provider);
    if (!provider) return res.status(400).json({ message: 'Unsupported provider' });

    const timestamp = String(req.header('x-timestamp') || req.body.timestamp || '');
    const signature = String(
      req.header('x-signature')
      || req.header('x-bkash-signature')
      || req.header('x-nagad-signature')
      || req.header('x-card-signature')
      || req.body.signature
      || ''
    );

    const secret = providerSecret(provider);
    const verified = verifySignedPayload({
      payload: req.body,
      timestamp,
      signature,
      secret
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    const extracted = extractWebhookData(req.body, provider);
    const eventId = String(req.header('x-event-id') || extracted.eventId || `${provider}-${Date.now()}`);

    const existingEvent = await PaymentWebhookEvent.findOne({ provider, eventId });
    if (existingEvent) {
      return res.json({ message: 'Duplicate webhook ignored', duplicate: true });
    }

    const event = await PaymentWebhookEvent.create({
      provider,
      eventId,
      externalPaymentId: extracted.externalPaymentId,
      payload: req.body,
      signature,
      processed: false
    });

    let tx = null;
    if (extracted.externalPaymentId) {
      tx = await PaymentTransaction.findOne({ externalPaymentId: extracted.externalPaymentId });
    }

    if (!tx && req.body.orderId) {
      tx = await PaymentTransaction.findOne({ order: req.body.orderId, provider }).sort({ createdAt: -1 });
    }

    if (!tx) {
      event.processError = 'Transaction not found';
      event.processed = true;
      event.processedAt = new Date();
      await event.save();
      return res.status(202).json({ message: 'Webhook accepted but transaction not found' });
    }

    const order = await Order.findById(tx.order);
    if (!order) {
      event.processError = 'Order not found';
      event.processed = true;
      event.processedAt = new Date();
      await event.save();
      return res.status(202).json({ message: 'Webhook accepted but order not found' });
    }

    if (extracted.status === 'succeeded') {
      tx.status = 'succeeded';
      tx.paidAt = new Date();
      tx.lastWebhookEventId = eventId;
      tx.updatedAt = new Date();

      order.isPaid = true;
      order.status = order.status === 'cancelled' ? 'cancelled' : 'paid';
      order.paymentInfo = {
        ...(order.paymentInfo || {}),
        provider,
        paymentReference: extracted.reference || tx.externalPaymentId,
        paymentStatus: 'verified'
      };
      order.statusHistory.push({
        status: order.status,
        note: `${provider} webhook marked payment as succeeded`,
        changedBy: null
      });
    } else if (extracted.status === 'failed') {
      tx.status = 'failed';
      tx.lastWebhookEventId = eventId;
      tx.updatedAt = new Date();

      order.paymentInfo = {
        ...(order.paymentInfo || {}),
        provider,
        paymentReference: extracted.reference || tx.externalPaymentId,
        paymentStatus: 'failed'
      };
      order.statusHistory.push({
        status: order.status,
        note: `${provider} webhook marked payment as failed`,
        changedBy: null
      });
    } else {
      tx.status = 'pending';
      tx.lastWebhookEventId = eventId;
      tx.updatedAt = new Date();

      order.paymentInfo = {
        ...(order.paymentInfo || {}),
        provider,
        paymentReference: extracted.reference || tx.externalPaymentId,
        paymentStatus: 'pending'
      };
    }

    await Promise.all([tx.save(), order.save()]);

    event.processed = true;
    event.processedAt = new Date();
    await event.save();

    return res.json({ message: 'Webhook processed', status: extracted.status });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};
