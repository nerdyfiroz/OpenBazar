// Banner Schema: For static ads
// Upgrade: Integrate real ad networks, analytics, scheduling, etc.
const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  image: String,
  link: String,
  isActive: { type: Boolean, default: true },
  forPromotion: { type: Boolean, default: false }, // Seller paid promotion flag
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Banner', BannerSchema);
