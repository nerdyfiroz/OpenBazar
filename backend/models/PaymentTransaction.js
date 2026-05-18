const mongoose = require('mongoose');

const PaymentTransactionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['bKash', 'Nagad', 'Card'], required: true },
  idempotencyKey: { type: String, required: true },
  requestHash: { type: String, required: true },
  externalPaymentId: { type: String, default: null },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'BDT' },
  status: {
    type: String,
    enum: ['initiated', 'pending', 'succeeded', 'failed'],
    default: 'initiated'
  },
  paymentUrl: { type: String, default: null },
  responseSnapshot: { type: Object, default: null },
  lastWebhookEventId: { type: String, default: null },
  paidAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PaymentTransactionSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
PaymentTransactionSchema.index({ externalPaymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
