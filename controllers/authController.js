const authService = require('../services/authService.js');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      if (result.requireOtp) {
        return res.json({
          success: true,
          message: 'OTP sent to your email',
          ...result
        });
      }

      if (result.requirePasswordChange) {
        return res.json({
          success: true,
          message: 'Password change required',
          ...result
        });
      }

      if (result.tokens?.refreshToken) {
        res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      console.error('Login error:', error);

      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (error.message === 'Account is inactive') {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive'
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { otpCode, otpSessionToken } = req.body;
      const result = await authService.verifyOtp(otpCode, otpSessionToken);

      if (result.requirePasswordChange) {
        return res.json({
          success: true,
          message: 'Password change required',
          ...result
        });
      }

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json({
        success: true,
        message: 'OTP verified successfully',
        ...result
      });
    } catch (error) {
      console.error('OTP verification error:', error);

      if (error.message === 'Invalid or expired session' || error.message === 'Invalid OTP code' || error.message === 'Invalid Authenticator code') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'OTP verification failed'
      });
    }
  }

  async resendOtp(req, res) {
    try {
      const { otpSessionToken } = req.body;
      const result = await authService.resendOtp(otpSessionToken);

      res.json({
        success: true,
        message: 'New OTP sent to your email',
        ...result
      });
    } catch (error) {
      console.error('Resend OTP error:', error);

      if (error.message === 'Invalid or expired session' || error.message === 'User not found') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Refresh token error:', error);

      if (error.message === 'Invalid or expired refresh token' || error.message === 'Refresh token not found') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      await authService.changePassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      if (error.message === 'Invalid or expired token' || error.message === 'User not found') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Password change failed'
      });
    }
  }

  // ✅ SECURITY FIX: Token from request body instead of URL param.
  //    Prevents token leaking into server logs, browser history, and Referer headers.
  async changePasswordFromBody(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      await authService.changePassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      if (error.message === 'Invalid or expired token' || error.message === 'User not found') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Password change failed'
      });
    }
  }

  async updateMyPassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current password and new password are required' });
      }
      const result = await authService.updateMyPassword(req.user.id, currentPassword, newPassword);

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json({
        success: true,
        message: 'ប្តូរពាក្យសម្ងាត់ជោគជ័យ! (Password changed securely)',
        accessToken: result.accessToken,
        user: result.user
      });
    } catch (error) {
      console.error('Update my password error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getProfile(req.user.id);

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get profile error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      await authService.updateProfile(req.user.id, req.body);

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      // ✅ SECURITY FIX: Never expose stack traces to the client
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }

      // Convert to relative path that the frontend can use with the API base URL
      const relativePath = '/' + req.file.path.replace(/\\/g, '/');

      await authService.updateAvatar(req.user.id, relativePath);

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: relativePath
        }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar'
      });
    }
  }

  async deleteAvatar(req, res) {
    try {
      await authService.removeAvatar(req.user.id);
      res.json({
        success: true,
        message: 'Avatar deleted successfully'
      });
    } catch (error) {
      console.error('Delete avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete avatar'
      });
    }
  }

  async setupTotp(req, res) {
    try {
      const result = await authService.setupTotp(req.user.id);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('TOTP setup error:', error);

      if (error.message === 'TOTP is already enabled') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to setup TOTP'
      });
    }
  }

  async verifyTotpSetup(req, res) {
    try {
      const { token, secret } = req.body;
      await authService.verifyTotpSetup(req.user.id, token, secret);

      res.json({
        success: true,
        message: 'TOTP enabled successfully'
      });
    } catch (error) {
      console.error('TOTP verify error:', error);

      if (error.message === 'Invalid TOTP token') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to verify TOTP'
      });
    }
  }

  async disableTotp(req, res) {
    try {
      const { token } = req.body;
      await authService.disableTotp(req.user.id, token);

      res.json({
        success: true,
        message: 'TOTP disabled successfully'
      });
    } catch (error) {
      console.error('TOTP disable error:', error);

      if (error.message === 'TOTP is not enabled' || error.message === 'Invalid TOTP token') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to disable TOTP'
      });
    }
  }
  async generateTelegramLinkToken(req, res) {
    try {
      const telegramBot = require('../services/telegramBot');
      if (telegramBot && telegramBot.generateLinkingToken) {
        const token = telegramBot.generateLinkingToken(req.user.id);
        res.status(200).json({ success: true, token });
      } else {
        res.status(500).json({ success: false, message: 'Telegram linking not configured properly' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error generating link token' });
    }
  }

  async generateOtpTelegramLinkToken(req, res) {
    try {
      const otpTelegramBot = require('../services/otpTelegramBot');
      if (otpTelegramBot && otpTelegramBot.generateLinkingToken) {
        const token = otpTelegramBot.generateLinkingToken(req.user.id);
        res.status(200).json({ success: true, token });
      } else {
        res.status(500).json({ success: false, message: 'OTP Telegram linking not configured properly' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error generating OTP link token' });
    }
  }

  async unlinkTelegram(req, res) {
    try {
      await authService.unlinkTelegram(req.user.id);
      res.json({
        success: true,
        message: 'Telegram account unlinked successfully'
      });
    } catch (error) {
      console.error('Telegram unlink error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlink Telegram account'
      });
    }
  }
  async unlinkOtpTelegram(req, res) {
    try {
      await authService.unlinkOtpTelegram(req.user.id);
      res.json({
        success: true,
        message: 'OTP Telegram account unlinked successfully'
      });
    } catch (error) {
      console.error('OTP Telegram unlink error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlink OTP Telegram account'
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);

      res.json({
        success: true,
        message: 'If the email exists, a reset link will be sent'
      });
    } catch (error) {
      console.error('Forgot password error:', error);

      if (error.message === 'USER_RESET_FORBIDDEN') {
        return res.status(403).json({
          success: false,
          message: 'USER_RESET_FORBIDDEN'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to process request'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);

      if (error.message === 'Invalid or expired reset token') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  }

  async logout(req, res) {
    try {
      if (req.user && req.user.id) {
        await authService.logout(req.user.id);
      }

      res.clearCookie('refreshToken', {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
      }

      await authService.verifyEmail(token);
      res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(400).json({ success: false, message: error.message || 'Email verification failed' });
    }
  }
}

module.exports = new AuthController();
