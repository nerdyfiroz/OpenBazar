// Order routes: user, seller
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

const router = express.Router();

// User
router.post('/', authenticate, authorize(['user']), ctrl.placeOrder);
router.get('/my', authenticate, authorize(['user']), ctrl.getMyOrders);

// Seller
router.get('/seller', authenticate, authorize(['seller']), ctrl.getSellerOrders);

// Admin
router.get('/admin/all', authenticate, authorize(['admin']), ctrl.getAllOrdersAdmin);
router.put('/admin/:id/status', authenticate, authorize(['admin']), ctrl.updateOrderStatusAdmin);

module.exports = router;
