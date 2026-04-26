// Order Controller: Place order, view, admin/seller/user logic
// Upgrade: Add payment API, courier API, order notifications, etc.
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { verifyPayment } = require('../services/paymentGateway');
const { validateCouponDoc } = require('./couponController');

const PAID_STATUSES = ['paid', 'confirmed', 'processing', 'shipped', 'delivered'];

const buildGuestCustomer = (paymentInfo = {}) => ({
  name: String(paymentInfo.customerName || '').trim(),
  email: String(paymentInfo.email || '').trim().toLowerCase(),
  phone: String(paymentInfo.phone || '').trim()
});

const buildShippingAddress = (paymentInfo = {}) => ({
  division: String(paymentInfo.division || '').trim(),
  district: String(paymentInfo.district || '').trim(),
  upazila: String(paymentInfo.upazila || '').trim(),
  ward: String(paymentInfo.ward || '').trim(),
  area: String(paymentInfo.area || '').trim(),
  fullAddress: String(paymentInfo.fullAddress || paymentInfo.address || '').trim()
});

const calculateDeliveryCharge = ({ division, totalItems }) => {
  const normalizedDivision = String(division || '').trim().toLowerCase();
  const isDhaka = normalizedDivision === 'dhaka';
  const baseCharge = isDhaka ? 70 : 120;

  if (Number(totalItems || 0) >= 4) return 0;
  if (Number(totalItems || 0) >= 3) return Math.max(0, Number((baseCharge * 0.3).toFixed(2)));
  return baseCharge;
};

const productWasPurchasedByOrders = (orders = [], productId) => orders.some((order) =>
  PAID_STATUSES.includes(order.status)
  && Array.isArray(order.products)
  && order.products.some((item) => item.product && item.product.toString() === productId.toString())
);

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
    const { products, paymentMethod, paymentInfo = {} } = req.body;
    const buyer = req.user || null;

    if (!Array.isArray(products) || !products.length) {
      return res.status(400).json({ message: 'No products found in the order' });
    }

    if (!['COD', 'bKash', 'Nagad', 'Rocket'].includes(paymentMethod)) {
      return res.status(400).json({
        message: 'Choose COD or mobile banking send money (bKash, Nagad, Rocket).'
      });
    }

    const guestCustomer = buildGuestCustomer(paymentInfo);
    const shippingAddress = buildShippingAddress(paymentInfo);

    if (!buyer) {
      if (!guestCustomer.name || !guestCustomer.email || !guestCustomer.phone) {
        return res.status(400).json({ message: 'Guest checkout requires name, email, and phone number' });
      }
    }

    if (!shippingAddress.division || !shippingAddress.district || !shippingAddress.upazila || !shippingAddress.ward || !shippingAddress.fullAddress) {
      return res.status(400).json({ message: 'Please provide your division, district, upazila, ward, and full address' });
    }

    if (paymentMethod !== 'COD' && !String(paymentInfo.transactionId || '').trim()) {
      return res.status(400).json({ message: 'Transaction ID is required for mobile banking send money orders' });
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

    const totalItems = orderProducts.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const deliveryCharge = calculateDeliveryCharge({
      division: shippingAddress.division,
      totalItems
    });
    let discountTotal = 0;
    let appliedCoupon = null;

    const couponCode = String(paymentInfo?.couponCode || '').trim().toUpperCase();
    if (couponCode) {
      const couponDoc = await Coupon.findOne({ code: couponCode });
      const couponValidation = validateCouponDoc(couponDoc, subtotal, totalItems);
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
      paymentMethod,
      paymentInfo,
      orderTotal: total
    });

    if (!paymentVerification.ok) {
      return res.status(400).json({ message: paymentVerification.message || 'Payment validation failed' });
    }

    const order = new Order({
      user: buyer?._id || null,
      guestCustomer: buyer
        ? { name: buyer.name, email: buyer.email, phone: buyer.phone }
        : guestCustomer,
      shippingAddress,
      products: orderProducts,
      subtotal,
      discountTotal,
      deliveryCharge,
      total,
      appliedCoupon,
      paymentMethod,
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
          changedBy: buyer?._id || null
        }
      ],
      isPaid: paymentVerification.verified,
      commission: 0 // Calculated later
    });
    await order.save();

    if (appliedCoupon?.code) {
      // Increment total usage count
      await Coupon.findOneAndUpdate({ code: appliedCoupon.code }, { $inc: { usedCount: 1 } });

      // Increment distinct-user count if this buyer hasn't used the coupon before
      if (buyer?._id) {
        const prevOrdersWithCoupon = await Order.countDocuments({
          user: buyer._id,
          'appliedCoupon.code': appliedCoupon.code,
          _id: { $ne: order._id }
        });
        if (prevOrdersWithCoupon === 0) {
          await Coupon.findOneAndUpdate({ code: appliedCoupon.code }, { $inc: { usersUsedCount: 1 } });
        }
      }
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

exports.getSellerOrders = async (req, res) => {
  try {
    const sellerProducts = await Product.find({ seller: req.user._id }).select('_id name');
    const sellerProductIds = sellerProducts.map((p) => p._id.toString());

    const orders = await Order.find({
      'products.product': { $in: sellerProducts.map((p) => p._id) }
    }).sort({ createdAt: -1 });

    const enriched = orders.map((order) => {
      const myItems = (order.products || []).filter((item) =>
        sellerProductIds.includes(item.product?.toString())
      );
      const myRevenue = myItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
      return {
        _id: order._id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        customer: order.guestCustomer || { name: 'Registered User' },
        shippingAddress: order.shippingAddress,
        myItems,
        myRevenue
      };
    });

    const paidOrders = enriched.filter((o) =>
      ['delivered', 'shipped', 'paid', 'confirmed', 'processing'].includes(o.status)
    );
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.myRevenue, 0);
    const totalSold = paidOrders.reduce((sum, o) => sum + o.myItems.reduce((s, i) => s + Number(i.quantity || 1), 0), 0);

    res.json({
      orders: enriched,
      stats: { totalOrders: enriched.length, totalRevenue, totalSold }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
