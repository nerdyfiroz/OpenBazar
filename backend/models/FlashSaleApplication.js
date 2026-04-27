// FlashSaleApplication: Seller requests their product to be listed on flash sale
const mongoose = require('mongoose');

const FlashSaleApplicationSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

  // Requested deal details
  requestedDiscount: { type: Number, required: true, min: 1, max: 90 }, // % off
  requestedPrice: { type: Number, required: true, min: 0 },             // final sale price
  proposedStartAt: { type: Date, required: true },
  proposedEndAt: { type: Date, required: true },

  // Admin decision
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNote: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Seller's note / reason for the deal
  sellerNote: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FlashSaleApplication', FlashSaleApplicationSchema);
