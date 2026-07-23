const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');
const { authenticate, requireAdmin } = require('../middleware/auth'); // assuming requireAdmin exists, if not, I'll check

router.get('/unpaid', authenticate, fineController.getUnpaidFines);
router.post('/pay', authenticate, fineController.payFine);
router.get('/report', authenticate, fineController.getPaymentReport);

module.exports = router;
