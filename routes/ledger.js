const express = require('express');
const router = express.Router();

const ledgerController = require('../controllers/ledgerController');

// GET /api/ledger - Get the full fine ledger (Super Admin / Admin only, enforced by app-level auth)
router.get('/', ledgerController.getLedger);

// POST /api/ledger/pay - Record a payment
router.post('/pay', ledgerController.makePayment);

module.exports = router;
