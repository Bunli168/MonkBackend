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


  async getRoleStats(req, res) {
    try {
      const { User, UserProfile } = require('../models');
      const { Op } = require('sequelize');
      const requestingUser = req.user;

      const where = {};
      const userProfileWhere = {};

      if (requestingUser && requestingUser.role_id === 2) {
        where.role_id = { [Op.in]: [3, 4, 7] };
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
      const role = req.user.Role ? req.user.Role.name.toUpperCase() : (req.user.role || '').toUpperCase();
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
      const role = req.user.Role ? req.user.Role.name.toUpperCase() : (req.user.role || '').toUpperCase();
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
      const role = req.user.Role ? req.user.Role.name.toUpperCase() : (req.user.role || '').toUpperCase();
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
      const role = req.user.Role ? req.user.Role.name.toUpperCase() : (req.user.role || '').toUpperCase();
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
      const role = req.user.Role ? req.user.Role.name.toUpperCase() : (req.user.role || '').toUpperCase();
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
      const role = req.user.Role ? req.user.Role.name.toUpperCase() : (req.user.role || '').toUpperCase();
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
      const role = req.user.Role ? req.user.Role.name.toUpperCase() : (req.user.role || '').toUpperCase();
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
      const user = await userService.getUserFullProfile(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      await user.update(req.body);
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
      const { User } = require('../models');
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      const hashedPassword = await bcrypt.hash('Neakavorn@123', 10);
      await user.update({ password: hashedPassword, must_change_password: true });
      res.status(200).json({ success: true, message: 'Password reset to default. User must change password on next login.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = userController;
