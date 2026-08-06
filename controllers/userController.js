const userService = require('../services/userService');

const userController = {

  // ── Admin / SuperAdmin creates a new member ────────────────────
  async registerUser(req, res) {
    try {
      const result = await userService.registerUser(req.body, req.user.id, req.user);
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Credentials sent via email.',
        data: result
      });
    } catch (error) {
      console.error("registerUser error:", error);
      const clientErrors = [
        'Invalid role',
        'Email already in use',
        'Either email or name is required',
        'role_id is required',
        'Super Admin cannot be auto-generated. Please provide an email address.'
      ];
      const status = clientErrors.includes(error.message) ? 400 : 500;
      
      let errorMsg = error.message;
      if (error.errors && Array.isArray(error.errors)) {
        errorMsg = error.errors.map(e => e.message).join(', ');
      }
      
      res.status(status).json({ success: false, message: errorMsg });
    }
  },

  async resendVerification(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      await userService.resendVerification(email);
      res.json({ success: true, message: 'Verification email resent successfully' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to resend verification email' });
    }
  },

  async getRoleStats(req, res) {
    try {
      const { User, UserProfile } = require('../models');
      const { Op } = require('sequelize');
      const requestingUser = req.user;

      const where = {};
      const userProfileWhere = {};

      if (requestingUser && requestingUser.role_id === 2) {
        where.role_id = { [Op.in]: [2, 3, 4, 7] };
        if (requestingUser.UserProfile && requestingUser.UserProfile.kut_id) {
          userProfileWhere.kut_id = requestingUser.UserProfile.kut_id;
        } else {
          userProfileWhere.kut_id = null;
        }
      } else {
        const { Role } = require('../models');
        const excludeRoles = await Role.findAll({ 
          where: { name: { [Op.in]: ['AttendanceTaker', 'SuperAdmin'] } } 
        });
        if (excludeRoles && excludeRoles.length > 0) {
          const excludeIds = excludeRoles.map(r => r.id);
          where.role_id = { [Op.notIn]: excludeIds };
        }
      }

      if (req.query.isActive !== undefined && req.query.isActive !== '') {
        where.is_active = req.query.isActive === 'true';
      }

      const stats = await User.findAll({
        where,
        include: [{ model: UserProfile, where: Object.keys(userProfileWhere).length ? userProfileWhere : undefined, attributes: [] }],
        attributes: ['role_id', [require('sequelize').fn('COUNT', '*'), 'count']],
        group: ['role_id'],
        raw: true
      });
      
      const total = stats.reduce((acc, stat) => acc + parseInt(stat.count, 10), 0);
      
      const roleStats = { all: total };
      stats.forEach(stat => {
        roleStats[stat.role_id] = parseInt(stat.count, 10);
      });
      
      res.status(200).json({ success: true, data: roleStats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const { search, isActive, isVerified, roleId, roleIds, page, perPage, sortBy, sortOrder, kutId, kut_id, includeTakers } = req.query;
      const options = { search, isActive, isVerified, roleId, roleIds, page, perPage, sortBy, sortOrder, kutId: kutId || kut_id, includeTakers, requestingUser: req.user };
      
      const result = await userService.getAllUsers(options);
      res.status(200).json({ success: true, data: result.users, meta: result.meta });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get user with profile, addresses, documents
  async getFullProfile(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent IDOR
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      if (req.user.id !== parseInt(id) && !['SUPERADMIN', 'ADMIN'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const userFullProfile = await userService.getUserFullProfile(id);
      
      const profileData = userFullProfile.toJSON();
      
      // Ensure the frontend receives the formatted name and role
      const formattedProfile = {
        ...profileData,
        firstName: profileData.UserProfile ? profileData.UserProfile.first_name_kh || profileData.UserProfile.first_name_en : null,
        lastName: profileData.UserProfile ? profileData.UserProfile.last_name_kh || profileData.UserProfile.last_name_en : null,
        isActive: profileData.is_active,
        name: profileData.UserProfile ? (profileData.UserProfile.first_name_kh || profileData.UserProfile.last_name_kh ? `${profileData.UserProfile.first_name_kh || ''} ${profileData.UserProfile.last_name_kh || ''}`.trim() : `${profileData.UserProfile.first_name_en || ''} ${profileData.UserProfile.last_name_en || ''}`.trim()) : '',
        role: profileData.Role ? { id: profileData.Role.id, name: profileData.Role.name } : null,
        profile: profileData.UserProfile ? {
          ...profileData.UserProfile,
          avatarUrl: profileData.UserProfile.avatar_url,
          phone: profileData.UserProfile.phone_number || profileData.phone || '',
          dateOfBirth: profileData.UserProfile.date_of_birth || '',
          kut: profileData.UserProfile.Kut ? profileData.UserProfile.Kut : null
        } : null
      };
      
      res.status(200).json({ success: true, data: formattedProfile });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  // Get current logged-in user profile
  async getMyProfile(req, res) {
    try {
      const userId = req.user.id;
      const userFullProfile = await userService.getUserFullProfile(userId);
      const profileData = userFullProfile.toJSON();
      
      // Ensure the frontend receives the formatted name and role
      const formattedProfile = {
        ...profileData,
        name: profileData.UserProfile ? (profileData.UserProfile.first_name_kh || profileData.UserProfile.last_name_kh ? `${profileData.UserProfile.first_name_kh || ''} ${profileData.UserProfile.last_name_kh || ''}`.trim() : `${profileData.UserProfile.first_name_en || ''} ${profileData.UserProfile.last_name_en || ''}`.trim()) : '',
        role: profileData.Role ? profileData.Role.name : null,
        profile: profileData.UserProfile ? {
          ...profileData.UserProfile,
          avatarUrl: profileData.UserProfile.avatar_url,
          phone: profileData.UserProfile.phone_number || profileData.phone || '',
          dateOfBirth: profileData.UserProfile.date_of_birth || '',
          kut: profileData.UserProfile.Kut ? profileData.UserProfile.Kut : null
        } : null
      };
      
      res.status(200).json({ success: true, data: formattedProfile });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent IDOR
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      if (req.user.id !== parseInt(id) && !['SUPERADMIN', 'ADMIN'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const profile = await userService.updateUserProfile(id, req.body);
      res.status(200).json({ success: true, message: 'Profile updated', data: profile });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Add Address
  async addAddress(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent IDOR
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      if (req.user.id !== parseInt(id) && !['SUPERADMIN', 'ADMIN'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const address = await userService.addUserAddress(id, req.body);
      res.status(201).json({ success: true, message: 'Address added', data: address });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Update Address
  async updateAddress(req, res) {
    try {
      const { id, addressId } = req.params;
      
      // Prevent IDOR
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      if (req.user.id !== parseInt(id) && !['SUPERADMIN', 'ADMIN'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const result = await userService.updateUserAddress(addressId, id, req.body);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Delete Address
  async deleteAddress(req, res) {
    try {
      const { id, addressId } = req.params;
      
      // Prevent IDOR
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      if (req.user.id !== parseInt(id) && !['SUPERADMIN', 'ADMIN'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const result = await userService.deleteUserAddress(addressId, id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Add Document
  async addDocument(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent IDOR
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      if (req.user.id !== parseInt(id) && !['SUPERADMIN', 'ADMIN'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const document = await userService.addUserDocument(id, req.body);
      res.status(201).json({ success: true, message: 'Document added', data: document });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Delete Document
  async deleteDocument(req, res) {
    try {
      const { id, documentId } = req.params;
      
      // Prevent IDOR
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      if (req.user.id !== parseInt(id) && !['SUPERADMIN', 'ADMIN'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const result = await userService.deleteUserDocument(documentId, id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Update User (status, role, etc.)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { User } = require('../models');
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Prevent IDOR & Privilege Escalation (A is A, B cannot cheat)
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      const isSuperAdmin = req.user.role_id === 1 || role === 'SUPERADMIN';
      const isAdmin = req.user.role_id === 2 || role === 'ADMIN';

      if (req.user.id !== parseInt(id) && !isSuperAdmin && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot modify another account' });
      }
      if (user.role_id === 1 && req.user.id !== user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden: Nobody can modify a Super Admin account except themselves' });
      }
      if (user.role_id === 2 && !isSuperAdmin && req.user.id !== user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can modify an Admin account' });
      }

      // --- KUDI ADMIN LIMIT VALIDATION (Role Change) ---
      if (req.body.role_id == 2 && user.role_id != 2) {
        const { UserProfile } = require('../models');
        const userProfile = await UserProfile.findOne({ where: { user_id: id } });
        if (userProfile && userProfile.kut_id) {
          const adminCount = await User.count({
            where: { role_id: 2 },
            include: [{
              model: UserProfile,
              where: { kut_id: userProfile.kut_id, user_id: { [require('sequelize').Op.ne]: id } },
              required: true
            }]
          });
          if (adminCount >= 3) {
            return res.status(400).json({ success: false, message: 'This Kudi already has the maximum of 3 Admins.' });
          }
        }
      }
      // -------------------------------------------------

      // Prevent unauthorized tampering of sensitive security fields via Mass Assignment
      const allowedFields = [
        'email', 
        'phone', 
        'address', 
        'is_active', 
        'totp_enabled', 
        'telegram_username', 
        'otp_telegram_username'
      ];
      
      if (isSuperAdmin) {
        allowedFields.push('role_id', 'is_verified', 'status');
      }

      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await user.update(updateData);
      res.status(200).json({ success: true, message: 'User updated successfully', data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Reset user password back to default
  async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const bcrypt = require('bcryptjs');
      const { User, RefreshToken } = require('../models');
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Prevent IDOR & Hacker cheating on Reset Password
      const role = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      const isSuperAdmin = req.user.role_id === 1 || role === 'SUPERADMIN';
      const isAdmin = req.user.role_id === 2 || role === 'ADMIN';

      if (!isSuperAdmin && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden: Only Admins can reset passwords' });
      }
      if (user.role_id === 1 && req.user.id !== user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot reset Super Admin password' });
      }
      if (user.role_id === 2 && !isSuperAdmin && req.user.id !== user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can reset Admin password' });
      }

      const hashedPassword = await bcrypt.hash('Neakavorn@123', 10);
      await user.update({ password: hashedPassword, must_change_password: true });

      // Kill all existing sessions/tokens for this user immediately so hacker or old session is disconnected!
      if (RefreshToken) {
        await RefreshToken.destroy({ where: { user_id: user.id } });
      }

      res.status(200).json({ success: true, message: 'Password reset to default. User must change password on next login.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async changeUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role_id } = req.body;
      const { User, Role } = require('../models');

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const currentUserRole = req.user.Role ? req.user.Role.name.replace(/\s+/g, "").toUpperCase() : (req.user.role || '').replace(/\s+/g, "").toUpperCase();
      const isSuperAdmin = req.user.role_id === 1 || currentUserRole === 'SUPERADMIN';
      const isAdmin = req.user.role_id === 2 || currentUserRole === 'ADMIN';

      if (!isSuperAdmin && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to change roles.' });
      }

      // If user is not SuperAdmin, they can only modify Monk (3), Student (4), Bhikkhu (7) 
      // and they can only set the new role to Monk (3), Student (4), or Bhikkhu (7).
      if (!isSuperAdmin) {
        const allowedRoles = [3, 4, 7];
        if (!allowedRoles.includes(user.role_id) || !allowedRoles.includes(role_id)) {
          return res.status(403).json({ success: false, message: 'Forbidden: You can only swap roles between Monk, Bhikkhu, and Student.' });
        }
      }

      const newRole = await Role.findByPk(role_id);
      if (!newRole) return res.status(400).json({ success: false, message: 'Invalid role ID' });

      await user.update({ role_id: role_id });
      
      const updatedUser = await User.findByPk(id, {
        include: [{ model: Role, attributes: ['id', 'name'] }]
      });

      res.status(200).json({ success: true, message: 'User role updated successfully', data: updatedUser });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = userController;
