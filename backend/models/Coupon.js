const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: null, min: 0 },
  // Optional: if not provided, defaults to immediately active / no expiry
  startsAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date, default: () => new Date('2099-12-31T23:59:59Z') },
  // Total redemption limit across all users (null = unlimited)
  usageLimit: { type: Number, default: null, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  // Minimum cart items required (0 = no restriction, 4 = needs >= 4 items)
  minItemCount: { type: Number, default: 0, min: 0 },
  // Max times a single user can redeem this coupon (null = unlimited)
  perUserLimit: { type: Number, default: null, min: 1 },
  // Max distinct users who can redeem this coupon (null = unlimited)
  maxUsers: { type: Number, default: null, min: 1 },
  // Auto-tracked: number of distinct users who have used this coupon
  usersUsedCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', CouponSchema);
