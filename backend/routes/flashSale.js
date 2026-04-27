// Flash Sale Application routes
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/flashSaleController');

const router = express.Router();

// ── Seller routes ─────────────────────────────────────────────────────────────
// Submit a new flash sale application
router.post('/apply', authenticate, authorize(['seller']), ctrl.applyForFlashSale);

// Get all applications submitted by the logged-in seller
router.get('/mine', authenticate, authorize(['seller']), ctrl.getMyApplications);

// Withdraw a pending application
router.delete('/:id', authenticate, authorize(['seller']), ctrl.withdrawApplication);

// ── Admin routes ──────────────────────────────────────────────────────────────
// List all applications (filter by status query param: ?status=pending)
router.get('/admin/all', authenticate, authorize(['admin']), ctrl.adminGetApplications);

// Approve or reject an application
router.put('/admin/:id', authenticate, authorize(['admin']), ctrl.adminReviewApplication);

module.exports = router;
