// Invoice route
const express = require('express');
const { optionalAuthenticate } = require('../middleware/auth');
const ctrl = require('../controllers/invoiceController');

const router = express.Router();

router.get('/:id', optionalAuthenticate, ctrl.getInvoice);

module.exports = router;
