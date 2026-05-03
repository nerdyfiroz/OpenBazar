// Payout Schema: Manual payout tracking
// Upgrade: Automate payouts, integrate bKash/Nagad/Rocket API, payout history, etc.
const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: Number,
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payout', PayoutSchema);
