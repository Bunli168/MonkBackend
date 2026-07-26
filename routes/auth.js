const express = require('express');
const authController = require('../controllers/authController.js');
const { authenticate } = require('../middleware/auth.js');
const upload = require('../middleware/upload.js');
const { 
  loginValidation, 
  otpValidation, 
  changePasswordValidation, 
  totpValidation,
  totpSetupValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../middleware/validate.js');

const router = express.Router();

// Auth routes
router.post('/login', loginValidation, authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/verify-otp', otpValidation, authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/refresh-token', authController.refreshToken);
router.put('/change-default-password/:token', changePasswordValidation, authController.changePassword);
router.put('/change-password', authenticate, authController.updateMyPassword);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), authController.uploadAvatar);
router.delete('/profile/avatar', authenticate, authController.deleteAvatar);
router.post('/totp/setup', authenticate, authController.setupTotp);
router.post('/totp/verify-setup', authenticate, totpSetupValidation, authController.verifyTotpSetup);
router.post('/totp/disable', authenticate, totpValidation, authController.disableTotp);
router.post('/unlink-telegram', authenticate, authController.unlinkTelegram);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
