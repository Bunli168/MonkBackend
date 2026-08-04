const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { adminRegisterUserValidation, updateProfileValidation } = require('../middleware/validate');

router.use(authenticate);

// Get user role stats
router.get('/stats/roles', authenticate, userController.getRoleStats);

// Get my own full profile
router.get('/me', userController.getMyProfile);

// Register a new user (Admin/SuperAdmin only)
router.post('/register', authenticate, adminRegisterUserValidation, userController.registerUser);

// Resend verification email
router.post('/resend-verification', authenticate, userController.resendVerification);

// Public self-registration for monk/bhikkhu users
router.post('/self-register', userController.registerUser);

// Get all users (Admin/SuperAdmin)
router.get('/', authenticate, userController.getAll);

// Get specific user full profile
router.get('/:id', userController.getFullProfile);

// Update user profile
router.put('/:id/profile', updateProfileValidation, userController.updateProfile);

// Address Management
router.post('/:id/addresses', userController.addAddress);
router.put('/:id/addresses/:addressId', userController.updateAddress);
router.delete('/:id/addresses/:addressId', userController.deleteAddress);

// Update user (status, role changes)
router.put('/:id', authenticate, userController.updateUser);

// Reset user password to default
router.post('/:id/reset-password', authenticate, userController.resetUserPassword);

// Document Management
router.post('/:id/documents', userController.addDocument);
router.delete('/:id/documents/:documentId', userController.deleteDocument);

module.exports = router;
