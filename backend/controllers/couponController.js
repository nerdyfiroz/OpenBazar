const Coupon = require('../models/Coupon');

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
    const payload = {
      ...req.body,
      code: String(req.body.code || '').trim().toUpperCase()
    };

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

module.exports.validateCouponDoc = validateCouponDoc;
