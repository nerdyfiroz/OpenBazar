// Product Schema: Linked to Seller
// Upgrade: Add stock, variants, digital/downloadable products, etc.
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  saleType: {
    type: String,
    enum: ['regular', 'sale', 'preorder'],
    default: 'regular'
  },
  price: { type: Number, required: true, min: 0 },
  salePercent: { type: Number, min: 0, max: 100, default: 0 },
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
  colors: [{ type: String }],
  sizes: [{ type: String }],
  accessories: [{ type: String }],
  preorderStartAt: { type: Date, default: null },
  preorderEndAt: { type: Date, default: null },
  saleStartAt: { type: Date, default: null },
  saleEndAt: { type: Date, default: null },
  photos: [{ type: String }],
  video: {
    url: { type: String, default: null },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 }
  },
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
