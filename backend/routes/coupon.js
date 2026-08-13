const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/couponController');

const router = express.Router();

router.post('/validate', ctrl.validateCoupon);

// Public: get featured promo code for homepage banner
router.get('/featured', ctrl.getFeaturedCoupon);

// Public: list active coupons for cart eligibility UI (safe fields only)
router.get('/public', ctrl.listPublicCoupons);

router.get('/admin/all', authenticate, authorize(['admin']), ctrl.listCoupons);
router.post('/admin', authenticate, authorize(['admin']), ctrl.createCoupon);
router.put('/admin/:id', authenticate, authorize(['admin']), ctrl.updateCoupon);
router.put('/admin/:id/status', authenticate, authorize(['admin']), ctrl.toggleCoupon);
router.put('/admin/:id/feature', authenticate, authorize(['admin']), ctrl.setFeaturedCoupon);
router.delete('/admin/:id', authenticate, authorize(['admin']), ctrl.deleteCoupon);

module.exports = router;
