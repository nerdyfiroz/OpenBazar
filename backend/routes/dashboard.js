// Dashboard routes: user, seller, admin
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

const router = express.Router();

router.post('/visit', ctrl.trackVisitor);
router.get('/flash-sale', ctrl.flashSaleStatus);
router.get('/user', authenticate, authorize(['user']), ctrl.userDashboard);
router.get('/seller', authenticate, authorize(['seller']), ctrl.sellerDashboard);
router.get('/admin', authenticate, authorize(['admin']), ctrl.adminDashboard);

module.exports = router;
