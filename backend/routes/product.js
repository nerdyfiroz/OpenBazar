// Product routes: public, seller, admin
const express = require('express');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/productController');
const { uploadProductMedia } = require('../middleware/productUpload');

const router = express.Router();

// Public
router.get('/', ctrl.getAllProducts);
router.get('/suggestions', ctrl.getSuggestions);

// Seller
router.get('/seller/mine', authenticate, authorize(['seller']), ctrl.getSellerProducts);
router.post('/', authenticate, authorize(['seller']), uploadProductMedia, ctrl.createProduct);
router.post('/:id/reviews', optionalAuthenticate, ctrl.addOrUpdateReview);

// Admin
router.get('/admin/all', authenticate, authorize(['admin']), ctrl.adminGetAllProducts);
router.put('/admin/:id', authenticate, authorize(['admin']), ctrl.adminUpdateProduct);

router.put('/:id', authenticate, authorize(['seller']), uploadProductMedia, ctrl.updateProduct);
router.delete('/:id', authenticate, authorize(['seller']), ctrl.deleteProduct);

// Public by id (keep last to avoid route conflicts)
router.get('/:id', ctrl.getProductById);

// Upgrade: Admin approval routes in admin.js

module.exports = router;
