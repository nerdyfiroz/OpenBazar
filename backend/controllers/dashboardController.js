// Dashboard Controller: User, Seller, Admin analytics
// Upgrade: Add charts, more analytics, export, etc.
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const VisitorStat = require('../models/VisitorStat');

exports.userDashboard = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json({ totalOrders: orders.length, orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sellerDashboard = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    const orders = await Order.find({ 'products.seller': req.user._id });
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    res.json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalSales,
      products,
      orders
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.adminDashboard = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalProducts = await Product.countDocuments();
    const totalSalesAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const soldProductsAgg = await Order.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: null,
          totalProductsSold: { $sum: '$products.quantity' }
        }
      }
    ]);
    const topSellingProductsAgg = await Order.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          soldQuantity: { $sum: '$products.quantity' }
        }
      },
      { $sort: { soldQuantity: -1 } },
      { $limit: 5 }
    ]);

    const productMapIds = topSellingProductsAgg.map((item) => item._id);
    const productDocs = await Product.find({ _id: { $in: productMapIds } }).select('name');
    const nameMap = productDocs.reduce((acc, p) => {
      acc[p._id.toString()] = p.name;
      return acc;
    }, {});

    const visitorsAgg = await VisitorStat.aggregate([
      { $group: { _id: null, totalVisitors: { $sum: '$count' } } }
    ]);

    const totalCommission = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$commission' } } }
    ]);
    res.json({
      totalOrders,
      totalSellers,
      totalProducts,
      totalSales: totalSalesAgg[0]?.total || 0,
      totalProductsSold: soldProductsAgg[0]?.totalProductsSold || 0,
      totalVisitors: visitorsAgg[0]?.totalVisitors || 0,
      totalCommission: totalCommission[0]?.total || 0,
      topSellingProducts: topSellingProductsAgg.map((item) => ({
        productId: item._id,
        name: nameMap[item._id.toString()] || 'Unknown Product',
        soldQuantity: item.soldQuantity
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flashSaleStatus = async (req, res) => {
  try {
    const now = new Date();

    const activeSaleProducts = await Product.find({
      isApproved: true,
      isActive: true,
      saleType: 'sale',
      $and: [
        { $or: [{ saleStartAt: null }, { saleStartAt: { $lte: now } }] },
        { $or: [{ saleEndAt: null }, { saleEndAt: { $gte: now } }] }
      ]
    })
      .select('name price discountPrice salePercent saleStartAt saleEndAt images')
      .sort({ saleEndAt: 1, createdAt: -1 });

    const nextEndsAt = activeSaleProducts.reduce((soonest, product) => {
      if (!product.saleEndAt) return soonest;
      if (!soonest) return product.saleEndAt;
      return product.saleEndAt < soonest ? product.saleEndAt : soonest;
    }, null);

    const status = activeSaleProducts.length ? 'active' : 'inactive';

    res.json({
      status,
      nextEndsAt,
      products: activeSaleProducts,
      count: activeSaleProducts.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.trackVisitor = async (req, res) => {
  try {
    const day = new Date().toISOString().slice(0, 10);

    await VisitorStat.findOneAndUpdate(
      { day },
      { $inc: { count: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Visitor tracked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
