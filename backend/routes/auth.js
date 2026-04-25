// Auth routes: Register, Login, Role logic, OTP verification
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticate, authorize } = require('../middleware/auth');
const { sendEmail, generateOTPTemplate } = require('../utils/emailSender');

const router = express.Router();

const getEmailVerificationArtifacts = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationTokenHash = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  const emailVerificationTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

  return {
    otp,
    otpExpiry,
    verificationToken,
    emailVerificationTokenHash,
    emailVerificationTokenExpiry
  };
};

const buildEmailVerificationLink = (email, verificationToken) => {
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${frontendBase}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(verificationToken)}`;
};

const getPasswordResetOtpArtifacts = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  return {
    otp,
    otpExpiry
  };
};

// Register (User or Seller) with OTP
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, phone, password, role } = req.body;
  if (role && !['user', 'seller'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

  try {
    let user = await User.findOne({ email });
    if (user && user.isVerified) return res.status(400).json({ message: 'Email already registered and verified' });

    const hash = await bcrypt.hash(password, 10);
    const userRole = role || 'user';
    const isBlocked = userRole === 'seller';
    
    const {
      otp,
      otpExpiry,
      verificationToken,
      emailVerificationTokenHash,
      emailVerificationTokenExpiry
    } = getEmailVerificationArtifacts();
    const verificationLink = buildEmailVerificationLink(email, verificationToken);
    
    if (user && !user.isVerified) {
      // Overwrite unverified account
      user.name = name;
      user.phone = phone;
      user.password = hash;
      user.role = userRole;
      user.isBlocked = isBlocked;
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.emailVerificationTokenHash = emailVerificationTokenHash;
      user.emailVerificationTokenExpiry = emailVerificationTokenExpiry;
      await user.save();
    } else {
      user = new User({ 
        name, email, phone, password: hash, 
        role: userRole,
        isBlocked,
        otp,
        otpExpiry,
        emailVerificationTokenHash,
        emailVerificationTokenExpiry,
        isVerified: false 
      });
      await user.save();
    }

    sendEmail(user.email, 'OpenBazar Identity Verification', generateOTPTemplate(otp, verificationLink));
    res.json({ message: 'Registered. Please check your email for the 6-digit OTP verification code.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify via one-time email link
router.get('/verify-email-link', async (req, res) => {
  try {
    const { email, token } = req.query;

    if (!email || !token) {
      return res.status(400).json({ message: 'Email and token are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) {
      const existingToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        message: 'Email already verified',
        token: existingToken,
        user: { id: user._id, name: user.name, role: user.role }
      });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    if (!user.emailVerificationTokenHash || user.emailVerificationTokenHash !== tokenHash) {
      return res.status(400).json({ message: 'Invalid verification link' });
    }
    if (!user.emailVerificationTokenExpiry || new Date() > user.emailVerificationTokenExpiry) {
      return res.status(400).json({ message: 'Verification link expired. Please request a new OTP.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    const authToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Email verified successfully',
      token: authToken,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP code' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP has expired. Please resend.' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Email verified successfully', token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP
router.post('/resend-otp', [body('email').isEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    // Rate limiting: 1 minute cooldown
    if (user.otpExpiry && (user.otpExpiry.getTime() - Date.now() > 4 * 60 * 1000)) {
      return res.status(429).json({ message: 'Please wait a minute before requesting another OTP.' });
    }

    const {
      otp,
      otpExpiry,
      verificationToken,
      emailVerificationTokenHash,
      emailVerificationTokenExpiry
    } = getEmailVerificationArtifacts();
    const verificationLink = buildEmailVerificationLink(email, verificationToken);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.emailVerificationTokenHash = emailVerificationTokenHash;
    user.emailVerificationTokenExpiry = emailVerificationTokenExpiry;
    await user.save();

    sendEmail(user.email, 'OpenBazar Identity Verification', generateOTPTemplate(otp, verificationLink));
    res.json({ message: 'A new OTP has been sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Password Reset Flow
router.post('/forgot-password', [body('email').isEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' }); // Don't leak exists for highly secure apps, but fine here
    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email before resetting password' });

    const { otp, otpExpiry } = getPasswordResetOtpArtifacts();
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    sendEmail(user.email, 'OpenBazar Password Reset', generateOTPTemplate(otp));
    res.json({ message: 'Password reset OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', [
  body('email').isEmail(),
  body('otp').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email before resetting password' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP Expired' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now login.' });
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
    if (!user.isVerified) return res.status(403).json({ message: 'Email not verified. Please request OTP.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials', canResetPassword: true });
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
