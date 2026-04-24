const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/couponController');

const router = express.Router();

router.post('/validate', ctrl.validateCoupon);

router.get('/admin/all', authenticate, authorize(['admin']), ctrl.listCoupons);
router.post('/admin', authenticate, authorize(['admin']), ctrl.createCoupon);
router.put('/admin/:id/status', authenticate, authorize(['admin']), ctrl.toggleCoupon);

module.exports = router;
