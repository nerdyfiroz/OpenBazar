// Order Controller: Place order, view, admin/seller/user logic
// Upgrade: Add payment API, courier API, order notifications, etc.
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { verifyPayment } = require('../services/paymentGateway');
const { validateCouponDoc } = require('./couponController');

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'paid'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

exports.placeOrder = async (req, res) => {
  try {
    const { products, paymentMethod, paymentInfo } = req.body;
    if (paymentMethod !== 'COD') {
      return res.status(400).json({
        message: 'Only Cash on Delivery (COD) is allowed at checkout. bKash/Nagad/Rocket are manual send money only.'
      });
    }

    // Validate products and calculate subtotal
    let subtotal = 0;
    const orderProducts = await Promise.all(products.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product || !product.isApproved) throw new Error('Invalid product');
      const effectivePrice = product.discountPrice ?? product.price;
      subtotal += effectivePrice * item.quantity;
      return {
        product: product._id,
        quantity: item.quantity,
        seller: product.seller,
        price: effectivePrice
      };
    }));

    const deliveryCharge = subtotal > 1500 ? 0 : 80;
    let discountTotal = 0;
    let appliedCoupon = null;

    const couponCode = String(paymentInfo?.couponCode || '').trim().toUpperCase();
    if (couponCode) {
      const couponDoc = await Coupon.findOne({ code: couponCode });
      const couponValidation = validateCouponDoc(couponDoc, subtotal);
      if (!couponValidation.ok) {
        return res.status(400).json({ message: couponValidation.message || 'Invalid coupon' });
      }

      discountTotal = couponValidation.discount;
      appliedCoupon = {
        code: couponDoc.code,
        discountAmount: discountTotal
      };
    }

    const total = Math.max(0, subtotal - discountTotal + deliveryCharge);

    const paymentVerification = verifyPayment({
      paymentMethod: 'COD',
      paymentInfo,
      orderTotal: total
    });

    if (!paymentVerification.ok) {
      return res.status(400).json({ message: paymentVerification.message || 'Payment validation failed' });
    }

    const order = new Order({
      user: req.user._id,
      products: orderProducts,
      subtotal,
      discountTotal,
      deliveryCharge,
      total,
      appliedCoupon,
      paymentMethod: 'COD',
      paymentInfo: {
        ...paymentInfo,
        provider: paymentVerification.provider,
        paymentReference: paymentVerification.reference,
        paymentStatus: paymentVerification.paymentStatus
      },
      status: paymentVerification.verified ? 'paid' : 'pending',
      statusHistory: [
        {
          status: paymentVerification.verified ? 'paid' : 'pending',
          note: paymentVerification.message,
          changedBy: req.user._id
        }
      ],
      isPaid: paymentVerification.verified,
      commission: 0 // Calculated later
    });
    await order.save();

    if (appliedCoupon?.code) {
      await Coupon.findOneAndUpdate({ code: appliedCoupon.code }, { $inc: { usedCount: 1 } });
    }

    await Promise.all(orderProducts.map((item) => Product.findByIdAndUpdate(
      item.product,
      { $inc: { soldCount: item.quantity } }
    )));

    res.json({ message: 'Order placed', order });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Order error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .populate('products.product')
        .sort({ createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Order.countDocuments({ user: req.user._id })
    ]);

    res.json({
      orders,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const [orders, total] = await Promise.all([
      Order.find({ 'products.seller': req.user._id })
        .populate('products.product')
        .sort({ createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Order.countDocuments({ 'products.seller': req.user._id })
    ]);
    
    res.json({
      orders,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const [orders, total] = await Promise.all([
      Order.find()
        .populate('user', 'name email phone')
        .populate('products.product', 'name')
        .sort({ createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Order.countDocuments()
    ]);
    
    res.json({
      orders,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const current = order.status;
    const allowedNext = STATUS_TRANSITIONS[current] || [];
    if (!allowedNext.includes(status) && current !== status) {
      return res.status(400).json({ message: `Invalid transition: ${current} -> ${status}` });
    }

    order.status = status;
    order.isPaid = status === 'paid' || order.isPaid;
    order.statusHistory.push({
      status,
      note: note || '',
      changedBy: req.user._id
    });
    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Upgrade: Commission calculation, payout logic
