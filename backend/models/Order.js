// Order Schema: Multi-vendor, manual payment
// Upgrade: Add delivery info, courier API, payment API, order status history, etc.
const mongoose = require('mongoose');

const OrderStatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  changedAt: { type: Date, default: Date.now }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      price: Number
    }
  ],
  subtotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  appliedCoupon: {
    code: String,
    discountAmount: { type: Number, default: 0 }
  },
  paymentMethod: { type: String, enum: ['COD', 'bKash', 'Nagad', 'Rocket', 'Card'], default: 'COD' },
  paymentInfo: {
    transactionId: String,
    screenshot: String, // URL or path
    provider: String,
    paymentReference: String,
    paymentStatus: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'],
    default: 'pending'
  },
  statusHistory: [OrderStatusHistorySchema],
  isPaid: { type: Boolean, default: false },
  commission: Number, // Calculated
  createdAt: { type: Date, default: Date.now },
  // Upgrade: Add delivery info, courier, etc.
});

module.exports = mongoose.model('Order', OrderSchema);
