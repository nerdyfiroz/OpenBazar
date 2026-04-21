const mongoose = require('mongoose');

const PaymentWebhookEventSchema = new mongoose.Schema({
  provider: { type: String, enum: ['bKash', 'Nagad', 'Card'], required: true },
  eventId: { type: String, required: true },
  externalPaymentId: { type: String, default: null },
  payload: { type: Object, required: true },
  signature: { type: String, default: '' },
  processed: { type: Boolean, default: false },
  processError: { type: String, default: '' },
  processedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

PaymentWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('PaymentWebhookEvent', PaymentWebhookEventSchema);
