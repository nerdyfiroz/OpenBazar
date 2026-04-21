// Auth routes: Register, Login, Role logic
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Register (User or Seller)
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ message: 'All fields required' });
  if (role && !['user', 'seller'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hash, role: role || 'user' });
    await user.save();
    // If seller, require admin approval (set isBlocked=true for sellers until approved)
    if (user.role === 'seller') user.isBlocked = true;
    await user.save();
    res.json({ message: 'Registered. Await admin approval if seller.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked or pending approval' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

// Admin user management
router.get('/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/block', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBlocked = Boolean(isBlocked);
    await user.save();

    res.json({
      message: 'User status updated',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isBlocked: user.isBlocked }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated wishlist
router.get('/wishlist', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isApproved: true, isActive: true }
    });
    res.json(user?.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/wishlist/:productId', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product || !product.isApproved || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);
    const exists = user.wishlist.some((id) => id.toString() === req.params.productId);
    if (!exists) user.wishlist.push(product._id);
    await user.save();

    const populated = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isApproved: true, isActive: true }
    });

    res.json({ message: 'Added to wishlist', wishlist: populated?.wishlist || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/wishlist/:productId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
    await user.save();

    const populated = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isApproved: true, isActive: true }
    });

    res.json({ message: 'Removed from wishlist', wishlist: populated?.wishlist || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
