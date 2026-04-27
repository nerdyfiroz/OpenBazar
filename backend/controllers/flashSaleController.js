// Flash Sale Application Controller
const FlashSaleApplication = require('../models/FlashSaleApplication');
const Product = require('../models/Product');

// ── Seller: Submit application ────────────────────────────────────────────────
exports.applyForFlashSale = async (req, res) => {
  try {
    const {
      productId,
      requestedDiscount,
      requestedPrice,
      proposedStartAt,
      proposedEndAt,
      sellerNote
    } = req.body;

    // Validate product belongs to this seller and is approved
    const product = await Product.findOne({ _id: productId, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or does not belong to you.' });
    }
    if (!product.isApproved) {
      return res.status(400).json({ message: 'Only approved products can be submitted for flash sale.' });
    }
    if (product.saleType === 'preorder') {
      return res.status(400).json({ message: 'Pre-order products cannot be listed on flash sale.' });
    }

    // Validate dates
    const start = new Date(proposedStartAt);
    const end = new Date(proposedEndAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid dates provided.' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }
    if (start < new Date()) {
      return res.status(400).json({ message: 'Start date must be in the future.' });
    }

    // Validate discount
    const discount = Number(requestedDiscount);
    const price = Number(requestedPrice);
    if (isNaN(discount) || discount < 1 || discount > 90) {
      return res.status(400).json({ message: 'Discount must be between 1% and 90%.' });
    }
    if (isNaN(price) || price <= 0 || price >= product.price) {
      return res.status(400).json({ message: 'Flash sale price must be less than the original price.' });
    }

    // Check for existing pending/approved application for this product
    const existing = await FlashSaleApplication.findOne({
      product: productId,
      seller: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending or approved application for this product.' });
    }

    const application = await FlashSaleApplication.create({
      seller: req.user._id,
      product: productId,
      requestedDiscount: discount,
      requestedPrice: price,
      proposedStartAt: start,
      proposedEndAt: end,
      sellerNote: sellerNote || ''
    });

    const populated = await FlashSaleApplication.findById(application._id)
      .populate('product', 'name price images photos category');

    res.status(201).json({ message: 'Flash sale application submitted!', application: populated });
  } catch (err) {
    console.error('[FlashSale] applyForFlashSale:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── Seller: Get my applications ───────────────────────────────────────────────
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await FlashSaleApplication.find({ seller: req.user._id })
      .populate('product', 'name price images photos category isApproved')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    console.error('[FlashSale] getMyApplications:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── Seller: Withdraw a pending application ────────────────────────────────────
exports.withdrawApplication = async (req, res) => {
  try {
    const app = await FlashSaleApplication.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!app) return res.status(404).json({ message: 'Application not found.' });
    if (app.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending applications can be withdrawn.' });
    }

    await app.deleteOne();
    res.json({ message: 'Application withdrawn.' });
  } catch (err) {
    console.error('[FlashSale] withdrawApplication:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── Admin: List all applications ──────────────────────────────────────────────
exports.adminGetApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const applications = await FlashSaleApplication.find(filter)
      .populate('product', 'name price images photos category')
      .populate('seller', 'name email phone')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ applications, total: applications.length });
  } catch (err) {
    console.error('[FlashSale] adminGetApplications:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── Admin: Approve or reject ──────────────────────────────────────────────────
exports.adminReviewApplication = async (req, res) => {
  try {
    const { action, adminNote } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "approve" or "reject".' });
    }

    const app = await FlashSaleApplication.findById(req.params.id).populate('product');
    if (!app) return res.status(404).json({ message: 'Application not found.' });
    if (app.status !== 'pending') {
      return res.status(400).json({ message: 'Application has already been reviewed.' });
    }

    app.status = action === 'approve' ? 'approved' : 'rejected';
    app.adminNote = adminNote || '';
    app.reviewedAt = new Date();
    app.reviewedBy = req.user._id;
    await app.save();

    // If approved: update the product to be on flash sale
    if (action === 'approve') {
      await Product.findByIdAndUpdate(app.product._id, {
        saleType: 'sale',
        discountPrice: app.requestedPrice,
        salePercent: app.requestedDiscount,
        saleStartAt: app.proposedStartAt,
        saleEndAt: app.proposedEndAt
      });
    }

    res.json({
      message: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      application: app
    });
  } catch (err) {
    console.error('[FlashSale] adminReviewApplication:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
