const jwt = require('jsonwebtoken');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// ─── Helpers ────────────────────────────────────────────────────────────────

function nullableInt(val, fallback = null) {
  if (val === '' || val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCouponPayload(body = {}) {
  return {
    ...body,
    code: String(body.code || '').trim().toUpperCase(),
    type: body.type,
    value: Number(body.value),
    minOrderAmount: nullableInt(body.minOrderAmount, 0),
    maxDiscount: nullableInt(body.maxDiscount, null),
    usageLimit: nullableInt(body.usageLimit, null),
    minItemCount: nullableInt(body.minItemCount, 0),
    // Per-user and max-users limits
    perUserLimit: nullableInt(body.perUserLimit, null),
    maxUsers: nullableInt(body.maxUsers, null),
    // Dates are optional — model defaults apply if omitted
    startsAt: body.startsAt || undefined,
    expiresAt: body.expiresAt || undefined,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive)
  };
}

function calculateDiscount(coupon, subtotal) {
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.value;
  }
  return Math.max(0, Math.min(discount, subtotal));
}

/**
 * Synchronous basic validation (no DB queries).
 * User-specific checks are done separately in validateCoupon endpoint.
 */
function validateCouponDoc(coupon, subtotal, totalItems = 0) {
  const now = new Date();

  if (!coupon || !coupon.isActive) return { ok: false, message: 'Coupon is not active' };
  if (now < coupon.startsAt) return { ok: false, message: 'Coupon has not started yet' };
  if (now > coupon.expiresAt) return { ok: false, message: 'Coupon has expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: 'Coupon total usage limit reached' };
  }
  if (coupon.maxUsers && coupon.usersUsedCount >= coupon.maxUsers) {
    return { ok: false, message: 'This coupon has reached its maximum user limit' };
  }
  if (subtotal < (coupon.minOrderAmount || 0)) {
    return { ok: false, message: `Minimum order amount is ৳${coupon.minOrderAmount}` };
  }
  if (coupon.minItemCount > 0 && Number(totalItems) < coupon.minItemCount) {
    return {
      ok: false,
      message: `This coupon requires at least ${coupon.minItemCount} item${coupon.minItemCount === 1 ? '' : 's'} in your cart`
    };
  }

  const discount = calculateDiscount(coupon, subtotal);
  return {
    ok: true,
    discount,
    finalTotal: Math.max(0, subtotal - discount),
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      minOrderAmount: coupon.minOrderAmount,
      minItemCount: coupon.minItemCount || 0,
      perUserLimit: coupon.perUserLimit || null,
      maxUsers: coupon.maxUsers || null
    }
  };
}

// ─── Extract optional userId from Authorization header ───────────────────────
function extractUserId(req) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded._id || null;
  } catch {
    return null;
  }
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

exports.validateCoupon = async (req, res) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const subtotal = Number(req.body.subtotal || 0);
    const totalItems = Number(req.body.totalItems || 0);

    if (!code) return res.status(400).json({ ok: false, message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code });
    const result = validateCouponDoc(coupon, subtotal, totalItems);
    if (!result.ok) return res.status(400).json(result);

    // Per-user limit check (only for authenticated users)
    const userId = req.user?._id || extractUserId(req);
    if (userId && coupon.perUserLimit) {
      const userUsed = await Order.countDocuments({
        user: userId,
        'appliedCoupon.code': code,
        status: { $nin: ['cancelled'] }
      });
      if (userUsed >= coupon.perUserLimit) {
        return res.status(400).json({
          ok: false,
          message: `You can only use this coupon ${coupon.perUserLimit} time${coupon.perUserLimit === 1 ? '' : 's'}`
        });
      }
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const payload = normalizeCouponPayload(req.body);

    if (!payload.code) return res.status(400).json({ message: 'Coupon code is required' });
    if (!['percentage', 'fixed'].includes(payload.type)) {
      return res.status(400).json({ message: 'Coupon type must be percentage or fixed' });
    }
    if (payload.expiresAt && payload.startsAt && new Date(payload.expiresAt) <= new Date(payload.startsAt)) {
      return res.status(400).json({ message: 'Expiry date must be after start date' });
    }

    const exists = await Coupon.findOne({ code: payload.code });
    if (exists) return res.status(400).json({ message: 'Coupon code already exists' });

    const coupon = await Coupon.create(payload);
    res.status(201).json({ message: 'Coupon created', coupon });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Invalid coupon data' });
  }
};

exports.listCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    coupon.isActive = Boolean(req.body.isActive);
    await coupon.save();
    res.json({ message: 'Coupon status updated', coupon });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    const payload = normalizeCouponPayload({ ...coupon.toObject(), ...req.body });

    if (!payload.code) return res.status(400).json({ message: 'Coupon code is required' });
    if (!['percentage', 'fixed'].includes(payload.type)) {
      return res.status(400).json({ message: 'Coupon type must be percentage or fixed' });
    }
    if (payload.expiresAt && payload.startsAt && new Date(payload.expiresAt) <= new Date(payload.startsAt)) {
      return res.status(400).json({ message: 'Expiry date must be after start date' });
    }

    const duplicate = await Coupon.findOne({ code: payload.code, _id: { $ne: coupon._id } });
    if (duplicate) return res.status(400).json({ message: 'Coupon code already exists' });

    coupon.code = payload.code;
    coupon.type = payload.type;
    coupon.value = payload.value;
    coupon.minOrderAmount = payload.minOrderAmount;
    coupon.maxDiscount = payload.maxDiscount;
    if (payload.startsAt) coupon.startsAt = payload.startsAt;
    if (payload.expiresAt) coupon.expiresAt = payload.expiresAt;
    coupon.usageLimit = payload.usageLimit;
    coupon.minItemCount = payload.minItemCount ?? 0;
    coupon.perUserLimit = payload.perUserLimit;
    coupon.maxUsers = payload.maxUsers;
    coupon.isActive = payload.isActive;

    await coupon.save();
    res.json({ message: 'Coupon updated', coupon });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Invalid coupon data' });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports.validateCouponDoc = validateCouponDoc;
