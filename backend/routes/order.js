// Order routes: user, seller, admin
const express = require('express');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

const router = express.Router();

// User
router.post('/', optionalAuthenticate, ctrl.placeOrder);
router.get('/my', authenticate, authorize(['user']), ctrl.getMyOrders);
router.get('/track/:id', optionalAuthenticate, ctrl.getOrderById);
router.put('/my/:id/cancel', authenticate, authorize(['user']), ctrl.cancelOrder); // Buyer cancel

// Seller
router.get('/seller', authenticate, authorize(['seller']), ctrl.getSellerOrders);
router.put('/seller/:id/tracking', authenticate, authorize(['seller']), ctrl.updateTracking);

// Admin
router.get('/admin/all', authenticate, authorize(['admin']), ctrl.getAllOrdersAdmin);
router.put('/admin/:id/status', authenticate, authorize(['admin']), ctrl.updateOrderStatusAdmin);
router.put('/admin/:id/tracking', authenticate, authorize(['admin']), ctrl.updateTracking);

module.exports = router;
