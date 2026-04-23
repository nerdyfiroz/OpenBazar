// Product Controller: CRUD, approval, seller-only management
// Upgrade: Add image upload, product reviews, search/filter, etc.
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, discountPrice, category, images } = req.body;

    if (discountPrice !== undefined && discountPrice !== null && Number(discountPrice) > Number(price)) {
      return res.status(400).json({ message: 'Discount price cannot be greater than base price' });
    }

    const product = new Product({
      name,
      description,
      price,
      discountPrice: discountPrice ?? null,
      category,
      images,
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

    if (
      req.body.discountPrice !== undefined
      && req.body.discountPrice !== null
      && Number(req.body.discountPrice) > Number(req.body.price ?? product.price)
    ) {
      return res.status(400).json({ message: 'Discount price cannot be greater than base price' });
    }

    Object.assign(product, req.body);
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
    const allowedFields = ['name', 'description', 'price', 'discountPrice', 'category', 'images', 'isApproved', 'isActive'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ message: 'Not found' });

    const nextPrice = updates.price ?? existingProduct.price;
    const nextDiscount = updates.discountPrice ?? existingProduct.discountPrice;
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
    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(req.params.id);
    if (!product || !product.isApproved || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingReview = product.reviews.find((rev) => rev.user.toString() === req.user._id.toString());

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = comment || '';
      existingReview.createdAt = new Date();
    } else {
      product.reviews.push({
        user: req.user._id,
        name: req.user.name,
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
