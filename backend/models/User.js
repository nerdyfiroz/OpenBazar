// User Schema: Buyer, Seller, Admin roles
// Upgrade: Add address, profile, KYC, social login, etc. for future scaling
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  isSellerVerifiedBadge: { type: Boolean, default: false },
  sellerApplication: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    storeName: { type: String, default: '' },
    realName: { type: String, default: '' },
    idType: { type: String, enum: ['', 'national-id', 'driving-license', 'passport'], default: '' },
    idNumber: { type: String, default: '' },
    bankDetails: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    faceVerificationUrl: { type: String, default: '' },
    idDocumentUrl: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '' }
  },
  sellerVerification: {
    badgeStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
    subscriptionFeeAmount: { type: Number, default: 0 },
    tipPaidAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' },
    transactionRef: { type: String, default: '' },
    requestedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' }
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  otp: { type: String },
  otpExpiry: { type: Date },
  emailVerificationTokenHash: { type: String },
  emailVerificationTokenExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // Upgrade: Add address, profile, etc.
});

module.exports = mongoose.model('User', UserSchema);
