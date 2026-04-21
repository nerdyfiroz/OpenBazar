const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

const router = express.Router();

router.post('/initiate', authenticate, authorize(['user']), ctrl.initiatePayment);
router.post('/webhook/:provider', ctrl.handleWebhook);

module.exports = router;
