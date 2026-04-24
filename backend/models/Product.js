// Product Schema: Linked to Seller
// Upgrade: Add stock, variants, digital/downloadable products, etc.
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  discountPrice: {
    type: Number,
    min: 0,
    default: null,
    validate: {
      validator(value) {
        return value === null || value <= this.price;
      },
      message: 'Discount price cannot be greater than base price'
    }
  },
  brand: { type: String, default: 'Generic' },
  rating: { type: Number, default: 4.2, min: 0, max: 5 },
  numReviews: { type: Number, default: 0, min: 0 },
  specifications: { type: String, default: '' },
  category: String,
  images: [String],
  soldCount: { type: Number, default: 0, min: 0 },
  reviews: [ReviewSchema],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  // Upgrade: Add stock, variants, etc.
});

module.exports = mongoose.model('Product', ProductSchema);
