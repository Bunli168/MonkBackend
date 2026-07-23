const express = require('express');
const router = express.Router();
const reportCategoryController = require('../controllers/reportCategoryController');
const { authenticate, authorize } = require('../middleware/auth');

// All report categories routes require authentication
router.use(authenticate);

// Get all categories (Everyone can view)
router.get('/', reportCategoryController.getAll);

// Get specific category
router.get('/:id', reportCategoryController.getById);

// Only SuperAdmin and Admin can manage categories
router.post('/', authenticate, reportCategoryController.create);
router.put('/:id', authenticate, reportCategoryController.update);
router.delete('/:id', authenticate, reportCategoryController.delete);

module.exports = router;
