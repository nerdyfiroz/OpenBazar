// Product Controller: CRUD, approval, seller-only management
// Upgrade: Add image upload, product reviews, search/filter, etc.
const Product = require('../models/Product');

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => String(item).trim()).filter(Boolean);
  return [];
};

const getUploadedMedia = (req) => {
  const uploadedPhotos = (req.files?.photos || []).slice(0, 3);
  const uploadedVideo = (req.files?.video || [])[0] || null;

  const photoUrls = uploadedPhotos.map((file) => `/uploads/products/${file.filename}`);
  const videoData = uploadedVideo
    ? {
        url: `/uploads/products/${uploadedVideo.filename}`,
        originalName: uploadedVideo.originalname,
        mimeType: uploadedVideo.mimetype,
        size: uploadedVideo.size
      }
    : null;

  return { photoUrls, videoData };
};

const PAID_STATUSES = ['paid', 'confirmed', 'processing', 'shipped', 'delivered'];

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      saleType,
      salePercent,
      category,
      brand,
      specifications,
      images,
      colors,
      sizes,
      accessories,
      preorderStartAt,
      preorderEndAt,
      saleStartAt,
      saleEndAt
    } = req.body;

    const normalizedSalePercent = salePercent !== undefined && salePercent !== null && salePercent !== ''
      ? Number(salePercent)
      : 0;
    const basePrice = Number(price);
    const computedDiscountPrice = normalizedSalePercent > 0
      ? Math.max(0, Number((basePrice * (1 - normalizedSalePercent / 100)).toFixed(2)))
      : (discountPrice ?? null);

    if (computedDiscountPrice !== undefined && computedDiscountPrice !== null && Number(computedDiscountPrice) > basePrice) {
      return res.status(400).json({ message: 'Discount price cannot be greater than base price' });
    }

    const { photoUrls, videoData } = getUploadedMedia(req);
    const bodyPhotos = normalizeList(req.body.photos || images);
    const finalPhotos = [...photoUrls, ...bodyPhotos];

    if (finalPhotos.length > 3) {
      return res.status(400).json({ message: 'You can upload up to 3 photos only' });
    }

    if (videoData && videoData.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'Video must be 10 MB or smaller' });
    }

    const bodyVideoUrl = typeof req.body.videoUrl === 'string' ? req.body.videoUrl.trim() : '';
    if (videoData && bodyVideoUrl) {
      return res.status(400).json({ message: 'Please provide only one video for the product' });
    }
    const finalVideo = videoData || (bodyVideoUrl ? { url: bodyVideoUrl, originalName: '', mimeType: '', size: 0 } : null);

    const product = new Product({
      name,
      description,
      saleType: ['sale', 'preorder'].includes(saleType) ? saleType : 'regular',
      price: basePrice,
      salePercent: normalizedSalePercent,
      discountPrice: computedDiscountPrice,
      category,
      brand,
      specifications,
      colors: normalizeList(colors),
      sizes: normalizeList(sizes),
      accessories: normalizeList(accessories),
      preorderStartAt: preorderStartAt || null,
      preorderEndAt: preorderEndAt || null,
      saleStartAt: saleStartAt || null,
      saleEndAt: saleEndAt || null,
      photos: finalPhotos,
      video: finalVideo,
      images: finalPhotos,
      seller: req.user._id,
      isApproved: false // Admin approval required
    });
    await product.save();
    res.json({ message: 'Product submitted for approval', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const filter = { isApproved: true, isActive: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ];
    }

    if (category) filter.category = { $regex: category, $options: 'i' };
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (rating) filter.rating = { $gte: Number(rating) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'popular') sortOption = { soldCount: -1, rating: -1, createdAt: -1 };

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Product.countDocuments(filter)
    ]);

    res.json({
      products,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);

    const products = await Product.find({
      isApproved: true,
      isActive: true,
      name: { $regex: q, $options: 'i' }
    })
      .select('name _id')
      .limit(8);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isApproved) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ message: 'Not found' });

    if (req.body.salePercent !== undefined && req.body.salePercent !== null && Number(req.body.salePercent) > 100) {
      return res.status(400).json({ message: 'Sale percentage cannot exceed 100' });
    }

    if (
      req.body.discountPrice !== undefined
      && req.body.discountPrice !== null
      && Number(req.body.discountPrice) > Number(req.body.price ?? product.price)
    ) {
      return res.status(400).json({ message: 'Discount price cannot be greater than base price' });
    }

    const { photoUrls, videoData } = getUploadedMedia(req);
    const bodyPhotos = normalizeList(req.body.photos || req.body.images);
    const mergedPhotos = [...photoUrls, ...bodyPhotos];

    if (mergedPhotos.length > 3) {
      return res.status(400).json({ message: 'You can upload up to 3 photos only' });
    }

    if (videoData && videoData.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'Video must be 10 MB or smaller' });
    }

    const bodyVideoUrl = typeof req.body.videoUrl === 'string' ? req.body.videoUrl.trim() : '';
    if (videoData && bodyVideoUrl) {
      return res.status(400).json({ message: 'Please provide only one video for the product' });
    }

    Object.assign(product, req.body);
    if (mergedPhotos.length) {
      product.photos = mergedPhotos;
      product.images = mergedPhotos;
    }
    if (videoData || bodyVideoUrl) {
      product.video = videoData || { url: bodyVideoUrl, originalName: '', mimeType: '', size: 0 };
    }
    product.isApproved = false; // Needs re-approval
    await product.save();
    res.json({ message: 'Product updated, pending approval', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.adminGetAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'name email');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.adminUpdateProduct = async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'description',
      'saleType',
      'price',
      'salePercent',
      'discountPrice',
      'category',
      'brand',
      'specifications',
      'colors',
      'sizes',
      'accessories',
      'preorderStartAt',
      'preorderEndAt',
      'saleStartAt',
      'saleEndAt',
      'photos',
      'video',
      'images',
      'isApproved',
      'isActive'
    ];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ message: 'Not found' });

    const nextPrice = updates.price ?? existingProduct.price;
    const nextDiscount = updates.discountPrice ?? existingProduct.discountPrice;
    const nextSalePercent = updates.salePercent ?? existingProduct.salePercent;
    if (nextSalePercent !== null && nextSalePercent !== undefined && Number(nextSalePercent) > 100) {
      return res.status(400).json({ message: 'Sale percentage cannot exceed 100' });
    }
    if (nextDiscount !== null && nextDiscount !== undefined && Number(nextDiscount) > Number(nextPrice)) {
      return res.status(400).json({ message: 'Discount price cannot be greater than base price' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    res.json({ message: 'Product updated by admin', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addOrUpdateReview = async (req, res) => {
  try {
    const { rating, comment, orderId, email, phone, name } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(req.params.id);
    if (!product || !product.isApproved || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let canReview = false;
    let reviewKey = null;
    let reviewerName = '';
    let reviewerEmail = '';
    let reviewerPhone = '';

    if (req.user?._id) {
      const Order = require('../models/Order');
      const orders = await Order.find({ user: req.user._id }).select('products status');
      canReview = orders.some((order) =>
        order.status === 'delivered'
        && Array.isArray(order.products)
        && order.products.some((item) => item.product && item.product.toString() === product._id.toString())
      );
      reviewKey = { user: req.user._id };
      reviewerName = req.user.name;
    } else if (orderId && (email || phone)) {
      const Order = require('../models/Order');
      const order = await Order.findById(orderId).select('products status guestCustomer');
      if (order) {
        const matchesContact =
          String(order.guestCustomer?.email || '').toLowerCase() === String(email || '').toLowerCase()
          || String(order.guestCustomer?.phone || '').trim() === String(phone || '').trim();
        const matchesName = !name || String(order.guestCustomer?.name || '').toLowerCase() === String(name || '').toLowerCase();
        const containsProduct = Array.isArray(order.products) && order.products.some((item) => item.product && item.product.toString() === product._id.toString());
        canReview = matchesContact && matchesName && containsProduct && order.status === 'delivered';
        reviewKey = { orderId: order._id };
        reviewerName = order.guestCustomer?.name || name || 'Guest Buyer';
        reviewerEmail = order.guestCustomer?.email || String(email || '').toLowerCase();
        reviewerPhone = order.guestCustomer?.phone || String(phone || '').trim();
      }
    }

    if (!canReview || !reviewKey) {
      return res.status(403).json({ message: 'You can only review a product after purchasing and using it.' });
    }

    const existingReview = product.reviews.find((rev) => {
      if (req.user?._id) return rev.user && rev.user.toString() === req.user._id.toString();
      return reviewKey.orderId && rev.orderId && rev.orderId.toString() === reviewKey.orderId.toString();
    });

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = comment || '';
      existingReview.createdAt = new Date();
    } else {
      product.reviews.push({
        user: req.user?._id || null,
        orderId: reviewKey.orderId || null,
        name: reviewerName || name || 'Guest Buyer',
        email: reviewerEmail,
        phone: reviewerPhone,
        rating: numericRating,
        comment: comment || ''
      });
    }

    product.numReviews = product.reviews.length;
    product.rating = product.numReviews
      ? product.reviews.reduce((sum, rev) => sum + rev.rating, 0) / product.numReviews
      : 0;

    await product.save();
    res.json({
      message: existingReview ? 'Review updated' : 'Review added',
      rating: product.rating,
      numReviews: product.numReviews,
      reviews: product.reviews
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
