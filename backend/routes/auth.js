// Auth routes: Register, Login, Role logic, OTP verification
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const SystemSetting = require('../models/SystemSetting');
const { authenticate, authorize } = require('../middleware/auth');
const { sendEmail, generateOTPTemplate } = require('../utils/emailSender');
const { uploadSellerVerification, processVerificationUploads } = require('../middleware/sellerVerificationUpload');

const router = express.Router();

const isSystemAdminUser = (user) => {
  const configuredSystemAdminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!configuredSystemAdminEmail) {
    return user?.role === 'admin';
  }

  return user?.role === 'admin' && String(user?.email || '').trim().toLowerCase() === configuredSystemAdminEmail;
};

const requireSystemAdmin = (req, res, next) => {
  if (!isSystemAdminUser(req.user)) {
    return res.status(403).json({ message: 'Only system admin can create new admin users' });
  }
  return next();
};

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

const SELLER_VERIFICATION_FEE_KEY = 'sellerVerificationFee';

const getSellerVerificationFee = async () => {
  const setting = await SystemSetting.findOne({ key: SELLER_VERIFICATION_FEE_KEY });
  if (!setting) return 0;
  return Number(setting.valueNumber || 0);
};

const setSellerVerificationFee = async (amount) => {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const setting = await SystemSetting.findOneAndUpdate(
    { key: SELLER_VERIFICATION_FEE_KEY },
    { valueNumber: numericAmount, updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return Number(setting.valueNumber || 0);
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
  if (role && role !== 'user') {
    return res.status(400).json({ message: 'Direct seller registration is disabled. Please register as user and apply for seller.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user && user.isVerified) return res.status(400).json({ message: 'Email already registered and verified' });

    const hash = await bcrypt.hash(password, 10);
    const userRole = 'user';
    const isBlocked = false;
    
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
      user.isSellerVerifiedBadge = false;
      user.sellerApplication = {
        status: 'none',
        realName: '',
        idType: '',
        idNumber: '',
        bankDetails: '',
        phoneNumber: '',
        photoUrl: '',
        faceVerificationUrl: '',
        idDocumentUrl: '',
        submittedAt: null,
        reviewedAt: null,
        reviewNote: ''
      };
      user.sellerVerification = {
        badgeStatus: 'unverified',
        subscriptionFeeAmount: 0,
        tipPaidAmount: 0,
        paymentStatus: 'unpaid',
        transactionRef: '',
        requestedAt: null,
        verifiedAt: null,
        rejectedAt: null,
        reviewedBy: null,
        note: ''
      };
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
        isSellerVerifiedBadge: false,
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
        user: { id: user._id, name: user.name, role: user.role, isSellerVerifiedBadge: Boolean(user.isSellerVerifiedBadge) }
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
      user: { id: user._id, name: user.name, role: user.role, isSellerVerifiedBadge: Boolean(user.isSellerVerifiedBadge) }
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
    res.json({ message: 'Email verified successfully', token, user: { id: user._id, name: user.name, role: user.role, isSellerVerifiedBadge: Boolean(user.isSellerVerifiedBadge) } });
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
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, isSellerVerifiedBadge: Boolean(user.isSellerVerifiedBadge) } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Seller onboarding and verification subscription
router.get('/seller-verification-fee', authenticate, async (req, res) => {
  try {
    const fee = await getSellerVerificationFee();
    res.json({ fee });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/seller-status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fee = await getSellerVerificationFee();
    res.json({
      role: user.role,
      isSellerVerifiedBadge: Boolean(user.isSellerVerifiedBadge),
      sellerApplication: user.sellerApplication,
      sellerVerification: user.sellerVerification,
      verificationFee: fee
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/seller/apply', authenticate, uploadSellerVerification, [
  body('storeName').notEmpty().withMessage('Store name is required'),
  body('realName').notEmpty().withMessage('Real name is required'),
  body('idType').isIn(['national-id', 'driving-license', 'passport']).withMessage('Valid ID type is required'),
  body('idNumber').notEmpty().withMessage('ID number is required'),
  body('bankDetails').notEmpty().withMessage('Bank details are required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Admin account cannot apply as seller' });

    await processVerificationUploads(req);

    const idDocument = req.files?.idDocument?.[0];
    const photo = req.files?.photo?.[0];
    const faceVerification = req.files?.faceVerification?.[0];

    // Allow existing sellers to update documents and details
    const isExistingSeller = user.role === 'seller';
    
    // If they aren't already an approved seller, they MUST upload documents
    if (!isExistingSeller && (!idDocument || !photo || !faceVerification)) {
      return res.status(400).json({ message: 'ID document, photo, and face verification photo are required' });
    }

    // Helper to get URL (Cloudinary or relative disk path)
    const toUrl = (file) => {
      if (!file) return null;
      if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
        return file.path;
      }
      return `/uploads/seller-verification/${file.filename}`;
    };

    user.sellerApplication = {
      ...user.sellerApplication,
      status: isExistingSeller ? 'approved' : 'pending',
      storeName: req.body.storeName,
      realName: req.body.realName,
      idType: req.body.idType,
      idNumber: req.body.idNumber,
      bankDetails: req.body.bankDetails,
      phoneNumber: req.body.phoneNumber,
      photoUrl: photo ? toUrl(photo) : user.sellerApplication.photoUrl,
      faceVerificationUrl: faceVerification ? toUrl(faceVerification) : user.sellerApplication.faceVerificationUrl,
      idDocumentUrl: idDocument ? toUrl(idDocument) : user.sellerApplication.idDocumentUrl,
      submittedAt: new Date(),
      reviewedAt: isExistingSeller ? user.sellerApplication.reviewedAt : null,
      reviewNote: isExistingSeller ? user.sellerApplication.reviewNote : ''
    };
    user.isBlocked = false;
    await user.save();

    res.json({ message: isExistingSeller ? 'Seller profile updated successfully' : 'Seller application submitted successfully', sellerApplication: user.sellerApplication });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/seller/verification/request', authenticate, [
  body('tipAmount').isFloat({ min: 0 }).withMessage('Tip amount must be valid'),
  body('transactionRef').notEmpty().withMessage('Transaction reference is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'seller') return res.status(403).json({ message: 'Only sellers can request verified badge' });

    const fee = await getSellerVerificationFee();
    const tipAmount = Number(req.body.tipAmount || 0);
    if (tipAmount < fee) {
      return res.status(400).json({ message: `Subscription tip must be at least ৳${fee.toFixed(2)}` });
    }

    user.sellerVerification = {
      badgeStatus: 'pending',
      subscriptionFeeAmount: fee,
      tipPaidAmount: tipAmount,
      paymentStatus: fee === 0 ? 'waived' : 'paid',
      transactionRef: String(req.body.transactionRef || '').trim(),
      requestedAt: new Date(),
      verifiedAt: null,
      rejectedAt: null,
      reviewedBy: null,
      note: String(req.body.note || '').trim()
    };
    await user.save();

    res.json({ message: 'Verified badge request submitted', sellerVerification: user.sellerVerification });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

// Admin user management
router.post('/admin/create', authenticate, authorize(['admin']), requireSystemAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const adminUser = new User({
      name,
      email,
      phone,
      password: hash,
      role: 'admin',
      isVerified: true,
      isBlocked: false,
      isSellerVerifiedBadge: false
    });
    await adminUser.save();

    res.status(201).json({
      message: 'New admin created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role,
        isBlocked: adminUser.isBlocked
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

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

router.get('/admin/seller-applications', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: 'admin' },
      'sellerApplication.status': { $in: ['pending', 'approved', 'rejected'] }
    }).select('-password').sort({ 'sellerApplication.submittedAt': -1, createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/seller-applications/:id', authenticate, authorize(['admin']), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reviewStatus = req.body.status;
    const reviewNote = String(req.body.reviewNote || '').trim();

    user.sellerApplication.status = reviewStatus;
    user.sellerApplication.reviewedAt = new Date();
    user.sellerApplication.reviewNote = reviewNote;

    if (reviewStatus === 'approved') {
      user.role = 'seller';
      user.isBlocked = false;
      user.isSellerVerifiedBadge = true; // Grant golden badge upon approval
    }

    await user.save();

    res.json({
      message: reviewStatus === 'approved' ? 'Seller application approved' : 'Seller application rejected',
      user: {
        id: user._id,
        role: user.role,
        sellerApplication: user.sellerApplication
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin/seller-verification-requests', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['seller'] },
      'sellerVerification.badgeStatus': { $in: ['pending', 'verified', 'rejected'] }
    }).select('-password').sort({ 'sellerVerification.requestedAt': -1, createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin/seller-verification-fee', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const fee = await getSellerVerificationFee();
    res.json({ fee });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/seller-verification-fee', authenticate, authorize(['admin']), [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const fee = await setSellerVerificationFee(req.body.amount);
    res.json({ message: 'Seller verification fee updated', fee });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/sellers/:id/verified-badge', authenticate, authorize(['admin']), [
  body('action').isIn(['verify', 'reject', 'clear']).withMessage('Invalid action')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'seller') return res.status(400).json({ message: 'Target user is not a seller' });

    const action = req.body.action;
    const waiveFee = Boolean(req.body.waiveFee);
    const note = String(req.body.note || '').trim();

    if (action === 'verify') {
      const requiredFee = Number(user.sellerVerification?.subscriptionFeeAmount || 0);
      const paidAmount = Number(user.sellerVerification?.tipPaidAmount || 0);
      const hasPaidEnough = paidAmount >= requiredFee;

      if (!waiveFee && !hasPaidEnough) {
        return res.status(400).json({
          message: `Seller has not paid required subscription fee (required ৳${requiredFee.toFixed(2)}). Use waiveFee=true to bypass.`
        });
      }

      user.isSellerVerifiedBadge = true;
      user.sellerVerification.badgeStatus = 'verified';
      user.sellerVerification.paymentStatus = waiveFee ? 'waived' : (requiredFee === 0 ? 'waived' : 'paid');
      user.sellerVerification.verifiedAt = new Date();
      user.sellerVerification.rejectedAt = null;
      user.sellerVerification.reviewedBy = req.user._id;
      user.sellerVerification.note = note;
    } else if (action === 'reject') {
      user.isSellerVerifiedBadge = false;
      user.sellerVerification.badgeStatus = 'rejected';
      user.sellerVerification.rejectedAt = new Date();
      user.sellerVerification.verifiedAt = null;
      user.sellerVerification.reviewedBy = req.user._id;
      user.sellerVerification.note = note;
    } else {
      user.isSellerVerifiedBadge = false;
      user.sellerVerification.badgeStatus = 'unverified';
      user.sellerVerification.paymentStatus = 'unpaid';
      user.sellerVerification.requestedAt = null;
      user.sellerVerification.verifiedAt = null;
      user.sellerVerification.rejectedAt = null;
      user.sellerVerification.reviewedBy = req.user._id;
      user.sellerVerification.note = note;
    }

    await user.save();

    res.json({
      message: 'Seller verified badge status updated',
      user: {
        id: user._id,
        isSellerVerifiedBadge: Boolean(user.isSellerVerifiedBadge),
        sellerVerification: user.sellerVerification
      }
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

// Update name / phone (authenticated)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = String(name).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    await user.save();
    res.json({ message: 'Profile updated', user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (authenticated, requires current password)
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public seller profile (no auth required)
router.get('/seller/:id', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select('name isSellerVerifiedBadge createdAt role sellerApplication.storeName sellerApplication.photoUrl');
    if (!seller || seller.role !== 'seller') return res.status(404).json({ message: 'Seller not found' });
    res.json({
      _id: seller._id,
      name: seller.name,
      storeName: seller.sellerApplication?.storeName || seller.name,
      photoUrl: seller.sellerApplication?.photoUrl,
      isSellerVerifiedBadge: Boolean(seller.isSellerVerifiedBadge),
      createdAt: seller.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
