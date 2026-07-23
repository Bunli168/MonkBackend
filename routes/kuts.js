const express = require('express');
const router = express.Router();
const kutController = require('../controllers/kutController');
const { authenticate, authorize } = require('../middleware/auth');
const { kutValidation } = require('../middleware/validate');

// Require authentication for all routes
router.use(authenticate);

// SuperAdmin and Admin can manage kuts
router.post('/', authenticate, kutValidation, kutController.create);
router.put('/:id', authenticate, kutValidation, kutController.update);
router.delete('/:id', authenticate, kutController.delete);

// Anyone logged in can view kuts
router.get('/', kutController.getAll);
router.get('/:id', kutController.getById);

module.exports = router;
