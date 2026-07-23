const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// SuperAdmin only for modifying roles
router.post('/', authenticate, roleController.create);
router.put('/:id', authenticate, roleController.update);
router.delete('/:id', authenticate, roleController.delete);

// Any authenticated user can view roles
router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);

module.exports = router;
