const Coupon = require('../models/Coupon');

function normalizeCouponPayload(body = {}) {
  const payload = {
    ...body,
    code: String(body.code || '').trim().toUpperCase(),
    type: body.type,
    value: Number(body.value),
    minOrderAmount: body.minOrderAmount === '' || body.minOrderAmount === null || body.minOrderAmount === undefined
      ? 0
      : Number(body.minOrderAmount),
    maxDiscount: body.maxDiscount === '' || body.maxDiscount === null || body.maxDiscount === undefined
      ? null
      : Number(body.maxDiscount),
    usageLimit: body.usageLimit === '' || body.usageLimit === null || body.usageLimit === undefined
      ? null
      : Number(body.usageLimit),
    startsAt: body.startsAt,
    expiresAt: body.expiresAt,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive)
  };

  return payload;
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

function validateCouponDoc(coupon, subtotal) {
  const now = new Date();

  if (!coupon || !coupon.isActive) return { ok: false, message: 'Coupon is not active' };
  if (now < coupon.startsAt) return { ok: false, message: 'Coupon is not started yet' };
  if (now > coupon.expiresAt) return { ok: false, message: 'Coupon has expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { ok: false, message: 'Coupon usage limit reached' };
  if (subtotal < (coupon.minOrderAmount || 0)) {
    return { ok: false, message: `Minimum order amount is ৳${coupon.minOrderAmount}` };
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
      minOrderAmount: coupon.minOrderAmount
    }
  };
}

exports.validateCoupon = async (req, res) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const subtotal = Number(req.body.subtotal || 0);

    if (!code) return res.status(400).json({ ok: false, message: 'Coupon code is required' });
    const coupon = await Coupon.findOne({ code });
    const result = validateCouponDoc(coupon, subtotal);

    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const payload = normalizeCouponPayload(req.body);

    if (!payload.code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

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

    if (!payload.code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

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
    coupon.startsAt = payload.startsAt;
    coupon.expiresAt = payload.expiresAt;
    coupon.usageLimit = payload.usageLimit;
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
