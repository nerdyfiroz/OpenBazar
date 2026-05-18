// Invoice route
const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/invoiceController');

const router = express.Router();

router.get('/:id', authenticate, ctrl.getInvoice);

module.exports = router;
