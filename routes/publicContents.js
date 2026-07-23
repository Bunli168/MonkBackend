const express = require('express');
const router = express.Router();
const publicContentController = require('../controllers/publicContentController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { publicContentValidation } = require('../middleware/validate');

// Public endpoints (no auth required for reading published content)
router.get('/', optionalAuth, publicContentController.getAll);
router.get('/:id', optionalAuth, publicContentController.getById);

// Protected endpoints (require auth and specific roles)
router.use(authenticate);

// SuperAdmin and Admin can manage public contents
router.post('/', authenticate, publicContentValidation, publicContentController.create);
router.put('/:id', authenticate, publicContentValidation, publicContentController.update);
router.delete('/:id', authenticate, publicContentController.delete);

module.exports = router;
