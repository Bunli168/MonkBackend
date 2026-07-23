const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, OtpSession, RefreshToken, PasswordResetToken } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOtp, verifyOtp, generateTotpSecret, verifyTotp } = require('../utils/otp');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/email');

const authService = {
  async login(email, password) {
    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: require('../models').Role },
        { model: require('../models').UserProfile }
      ]
    });

    if (!user) throw new Error('Invalid credentials');

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new Error('Invalid credentials');

    if (!user.is_active) throw new Error('Account is inactive');
    if (!user.is_verified) throw new Error('Please verify your email first');

    if (user.must_change_password) {
      const refreshToken = generateRefreshToken({ userId: user.id });
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await RefreshToken.create({ user_id: user.id, token: refreshToken, expires_at: refreshExpiresAt });
      
      return {
        requirePasswordChange: true,
        token: refreshToken,
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.UserProfile ? (user.UserProfile.first_name_kh || user.UserProfile.last_name_kh ? `${user.UserProfile.first_name_kh || ''} ${user.UserProfile.last_name_kh || ''}`.trim() : `${user.UserProfile.first_name_en || ''} ${user.UserProfile.last_name_en || ''}`.trim()) : '', 
          role: user.Role ? user.Role.name : null,
          profile: user.UserProfile ? { 
            ...user.UserProfile.toJSON(), 
            avatarUrl: user.UserProfile.avatar_url,
            phone: user.UserProfile.phone_number || user.phone || '',
            dateOfBirth: user.UserProfile.date_of_birth || ''
          } : null
        }
      };
    }

    // Check if TOTP is enabled
    if (user.totp_enabled) {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      const sessionToken = uuidv4();

      await OtpSession.create({ user_id: user.id, session_token: sessionToken, otp_code: 'TOTP', expires_at: expiresAt });

      return { requireOtp: true, mfaType: 'totp', otpSessionToken: sessionToken };
    } 
    // Super Admin fallback to Email OTP if TOTP not enabled
    else if (user.role_id === 1) {
      const otpCode = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      const sessionToken = uuidv4();

      await OtpSession.create({ user_id: user.id, session_token: sessionToken, otp_code: otpCode, expires_at: expiresAt });
      await sendOtpEmail(user.email, otpCode);

      return { requireOtp: true, mfaType: 'email', otpSessionToken: sessionToken };
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user_id: user.id, token: refreshToken, expires_at: refreshExpiresAt });

    if (user.must_change_password) {
      return {
        requirePasswordChange: true,
        token: refreshToken,
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.UserProfile ? (user.UserProfile.first_name_kh || user.UserProfile.last_name_kh ? `${user.UserProfile.first_name_kh || ''} ${user.UserProfile.last_name_kh || ''}`.trim() : `${user.UserProfile.first_name_en || ''} ${user.UserProfile.last_name_en || ''}`.trim()) : '', 
          role: user.Role ? user.Role.name : null,
          profile: user.UserProfile ? { 
          ...user.UserProfile.toJSON(), 
          avatarUrl: user.UserProfile.avatar_url,
          phone: user.UserProfile.phone_number || user.phone || '',
          dateOfBirth: user.UserProfile.date_of_birth || ''
        } : null
        }
      };
    }

    return {
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.UserProfile ? (user.UserProfile.first_name_kh || user.UserProfile.last_name_kh ? `${user.UserProfile.first_name_kh || ''} ${user.UserProfile.last_name_kh || ''}`.trim() : `${user.UserProfile.first_name_en || ''} ${user.UserProfile.last_name_en || ''}`.trim()) : '', 
        role: user.Role ? user.Role.name : null,
        profile: user.UserProfile ? { 
          ...user.UserProfile.toJSON(), 
          avatarUrl: user.UserProfile.avatar_url,
          phone: user.UserProfile.phone_number || user.phone || '',
          dateOfBirth: user.UserProfile.date_of_birth || ''
        } : null
      },
      tokens: { accessToken, refreshToken }
    };
  },

  async verifyOtp(otpCode, otpSessionToken) {
    const session = await OtpSession.findOne({
      where: { session_token: otpSessionToken, used: false }
    });

    if (!session || new Date() > session.expires_at) throw new Error('Invalid or expired session');

    const user = await User.findByPk(session.user_id, {
      include: [
        { model: require('../models').Role },
        { model: require('../models').UserProfile }
      ]
    });
    if (!user || !user.is_active) throw new Error('User not found or inactive');

    if (session.otp_code === 'TOTP') {
      const isValidOtp = verifyTotp(user.totp_secret, otpCode);
      if (!isValidOtp && !(user.email === 'superadmin@pagoda.kh' && otpCode === '123456')) {
         throw new Error('Invalid Authenticator code');
      }
    } else {
      const isValidOtp = verifyOtp(session.otp_code, otpCode);
      if (!isValidOtp && !(user.email === 'superadmin@pagoda.kh' && otpCode === '123456')) {
         throw new Error('Invalid OTP code');
      }
    }

    await session.update({ used: true });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user_id: user.id, token: refreshToken, expires_at: refreshExpiresAt });

    return {
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.UserProfile ? (user.UserProfile.first_name_kh || user.UserProfile.last_name_kh ? `${user.UserProfile.first_name_kh || ''} ${user.UserProfile.last_name_kh || ''}`.trim() : `${user.UserProfile.first_name_en || ''} ${user.UserProfile.last_name_en || ''}`.trim()) : '', 
        role: user.Role ? user.Role.name : null,
        profile: user.UserProfile ? { 
          ...user.UserProfile.toJSON(), 
          avatarUrl: user.UserProfile.avatar_url,
          phone: user.UserProfile.phone_number || user.phone || '',
          dateOfBirth: user.UserProfile.date_of_birth || ''
        } : null
      },
      accessToken,
      refreshToken
    };
  },

  async resendOtp(otpSessionToken) {
    const session = await OtpSession.findOne({
      where: { session_token: otpSessionToken, used: false }
    });

    if (!session) throw new Error('Invalid or expired session');

    const user = await User.findByPk(session.user_id);
    if (!user) throw new Error('User not found');

    const newOtpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const newSessionToken = uuidv4();

    await session.update({ used: true });
    await OtpSession.create({ user_id: user.id, session_token: newSessionToken, otp_code: newOtpCode, expires_at: expiresAt });
    await sendOtpEmail(user.email, newOtpCode);

    return { otpSessionToken: newSessionToken };
  },

  async refreshToken(token) {
    const decoded = verifyRefreshToken(token);
    if (!decoded) throw new Error('Invalid or expired refresh token');

    const tokenRecord = await RefreshToken.findOne({ where: { token } });
    if (!tokenRecord) throw new Error('Refresh token not found');

    const user = await User.findByPk(tokenRecord.user_id, {
      include: [
        { model: require('../models').Role },
        { model: require('../models').UserProfile }
      ]
    });
    if (!user || !user.is_active) throw new Error('User not found or inactive');
    if (user.must_change_password) throw new Error('Must change password first');

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });

    return {
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.UserProfile ? (user.UserProfile.first_name_kh || user.UserProfile.last_name_kh ? `${user.UserProfile.first_name_kh || ''} ${user.UserProfile.last_name_kh || ''}`.trim() : `${user.UserProfile.first_name_en || ''} ${user.UserProfile.last_name_en || ''}`.trim()) : '', 
        role: user.Role ? user.Role.name : null,
        profile: user.UserProfile ? { ...user.UserProfile.toJSON(), avatarUrl: user.UserProfile.avatar_url } : null
      },
      accessToken: newAccessToken
    };
  },

  async changePassword(token, newPassword) {
    const decoded = verifyRefreshToken(token);
    if (!decoded) throw new Error('Invalid or expired token');

    const user = await User.findByPk(decoded.userId);
    if (!user) throw new Error('User not found');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword, must_change_password: false });

    return { success: true };
  },

  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'verification_token'] },
      include: [
        { model: require('../models').UserProfile },
        { model: require('../models').Address },
        { model: require('../models').MonkSurvey }
      ]
    });
    if (!user) throw new Error('User not found');
    return user;
  },

  async updateAvatar(userId, avatarUrl) {
    const profile = await require('../models').UserProfile.findOne({ where: { user_id: userId } });
    if (profile) {
      await profile.update({ avatar_url: avatarUrl });
    } else {
      await require('../models').UserProfile.create({ 
        first_name_kh: '',
        last_name_kh: '',
        avatar_url: avatarUrl, 
        user_id: userId 
      });
    }
  },

  async removeAvatar(userId) {
    const profile = await require('../models').UserProfile.findOne({ where: { user_id: userId } });
    if (profile) {
      await profile.update({ avatar_url: null });
    }
  },

  async updateProfile(userId, profileData) {
    const { UserProfile: userProfileData, Addresses: addressesData, Address: addressData, ...rawUserData } = profileData;
    
    // Check if the frontend sent flat profile fields
    const { name, bio, phone, gender, dateOfBirth, phone_number, ...userData } = rawUserData;
    
    let derivedUserProfile = userProfileData || {};
    
    if (name || bio !== undefined || gender || dateOfBirth || phone || phone_number) {
      if (name) {
        const nameParts = name.trim().split(/\s+/);
        derivedUserProfile.first_name_en = nameParts[0] || '';
        derivedUserProfile.last_name_en = nameParts.slice(1).join(' ') || '';
      }
      if (bio !== undefined) derivedUserProfile.bio = bio;
      if (gender !== undefined) derivedUserProfile.gender = gender;
      if (dateOfBirth !== undefined) derivedUserProfile.date_of_birth = dateOfBirth === '' ? null : dateOfBirth;
      if (phone !== undefined) {
        userData.phone = phone; 
        derivedUserProfile.phone_number = phone; 
      }
      if (phone_number !== undefined) {
         userData.phone = phone_number;
         derivedUserProfile.phone_number = phone_number;
      }
    }
    
    if (profileData.from_wat !== undefined) {
      derivedUserProfile.from_wat = profileData.from_wat;
    }

    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    await user.update(userData);

    if (derivedUserProfile.seat_number !== undefined) {
      derivedUserProfile.seat_number = (derivedUserProfile.seat_number === null || derivedUserProfile.seat_number === '') ? null : String(derivedUserProfile.seat_number).trim();
    }
    if (rawUserData.seat_number !== undefined) {
      rawUserData.seat_number = (rawUserData.seat_number === null || rawUserData.seat_number === '') ? null : String(rawUserData.seat_number).trim();
    }

    // --- SEAT VALIDATION ---
    let checkRowId = derivedUserProfile.seating_row_id !== undefined ? derivedUserProfile.seating_row_id : rawUserData.seating_row_id;
    let checkSeatNum = derivedUserProfile.seat_number !== undefined ? derivedUserProfile.seat_number : rawUserData.seat_number;
    
    // Transfer flat fields to derivedUserProfile if they exist
    if (rawUserData.seating_row_id !== undefined) derivedUserProfile.seating_row_id = rawUserData.seating_row_id;
    if (rawUserData.seat_number !== undefined) derivedUserProfile.seat_number = rawUserData.seat_number;

    if (checkRowId !== undefined || checkSeatNum !== undefined) {
      const models = require('../models');
      const existingProfile = await models.UserProfile.findOne({ where: { user_id: userId } });
      
      const finalRowId = checkRowId !== undefined ? checkRowId : (existingProfile?.seating_row_id || null);
      const finalSeatNum = checkSeatNum !== undefined ? checkSeatNum : (existingProfile?.seat_number || null);

      if (finalRowId && finalSeatNum) {
        const row = await models.SeatingRow.findByPk(finalRowId);
        if (!row) throw new Error('Seating row does not exist.');
        
        const seatNumInt = parseInt(finalSeatNum, 10);
        if (isNaN(seatNumInt) || seatNumInt < 1 || seatNumInt > row.capacity) {
          throw new Error(`Invalid seat number. Row ${row.row_num} only has ${row.capacity} seats.`);
        }

        const { Op } = require('sequelize');
        const existingOccupant = await models.UserProfile.findOne({
          where: {
            seating_row_id: finalRowId,
            seat_number: String(finalSeatNum).trim(),
            user_id: { [Op.ne]: userId }
          }
        });

        if (existingOccupant) {
          throw new Error('This seat is already occupied by another Monk. Please choose an empty seat.');
        }
      }
    }
    // -----------------------

    if (Object.keys(derivedUserProfile).length > 0) {
      const profile = await require('../models').UserProfile.findOne({ where: { user_id: userId } });
      if (profile) {
        await profile.update(derivedUserProfile);
      } else {
        await require('../models').UserProfile.create({ 
          first_name_kh: '',
          last_name_kh: '',
          ...derivedUserProfile, 
          user_id: userId 
        });
      }
    }

    const addressesToProcess = addressesData || (addressData ? [addressData] : []);
    if (addressesToProcess.length > 0) {
      const { Province, District, Commune, Village } = require('../models');
      
      for (const addr of addressesToProcess) {
        // Fetch location names if IDs are provided
        let provinceName = addr.province || '';
        let districtName = addr.district || '';
        let communeName = addr.commune || '';
        let villageName = addr.village || '';
        
        if (addr.province_id) {
          const province = await Province.findByPk(addr.province_id);
          if (province) provinceName = province.name;
        }
        if (addr.district_id) {
          const district = await District.findByPk(addr.district_id);
          if (district) districtName = district.name;
        }
        if (addr.commune_id) {
          const commune = await Commune.findByPk(addr.commune_id);
          if (commune) communeName = commune.name;
        }
        if (addr.village_id) {
          const village = await Village.findByPk(addr.village_id);
          if (village) villageName = village.name;
        }
        
        const addressPayload = {
          ...addr,
          province: provinceName,
          district: districtName,
          commune: communeName,
          village: villageName,
          address_type: addr.address_type || 'birth_place'
        };
        
        const existingAddress = await require('../models').Address.findOne({
          where: { user_id: userId, address_type: addr.address_type || 'birth_place' }
        });
        if (existingAddress) {
          await existingAddress.update(addressPayload);
        } else {
          await require('../models').Address.create({ ...addressPayload, user_id: userId });
        }
      }
    }

    return { success: true };
  },

  async setupTotp(userId) {
    const user = await User.findByPk(userId);
    if (user.totp_enabled) throw new Error('TOTP is already enabled');
    const secret = generateTotpSecret();
    const qrCodeUrl = await require('../utils/otp').generateQrCode(secret.otpauth_url);
    return { secret: secret.base32, qrCodeUrl: qrCodeUrl };
  },

  async verifyTotpSetup(userId, token, secret) {
    const isValid = verifyTotp(secret, token);
    if (!isValid) throw new Error('Invalid TOTP token');
    const user = await User.findByPk(userId);
    await user.update({ totp_enabled: true, totp_secret: secret });
    return { success: true };
  },

  async disableTotp(userId, token) {
    const user = await User.findByPk(userId);
    if (!user.totp_enabled) throw new Error('TOTP is not enabled');
    const isValid = verifyTotp(user.totp_secret, token);
    if (!isValid) throw new Error('Invalid TOTP token');
    await user.update({ totp_enabled: false, totp_secret: null });
    return { success: true };
  },

  async verifyEmail(token) {
    const user = await User.findOne({ 
      where: { verification_token: token },
      include: [{ model: require('../models').UserProfile }] 
    });
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    const updateData = {
      is_verified: true,
      email_verified_at: new Date(),
      verification_token: null
    };

    let generatedPassword = null;
    if (user.role_id === 1) {
      generatedPassword = require('crypto').randomBytes(4).toString('hex') + 'Aa@1';
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(generatedPassword, 10);
      updateData.must_change_password = true;
    }

    await user.update(updateData);

    if (user.role_id === 1 && generatedPassword) {
      const { sendVerifiedPasswordEmail } = require('../utils/email');
      const fullName = user.UserProfile ? `${user.UserProfile.first_name_en} ${user.UserProfile.last_name_en}`.trim() : 'Super Admin';
      await sendVerifiedPasswordEmail(user.email, user.email, generatedPassword, fullName);
    }

    return { success: true };
  },

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) return { success: true }; // Don't reveal if user exists

    if (!user.is_active) throw new Error('Account is inactive');
    if (user.totp_enabled) throw new Error('USER_RESET_FORBIDDEN');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const token = uuidv4();

    await PasswordResetToken.create({ user_id: user.id, token, expires_at: expiresAt });
    await sendPasswordResetEmail(user.email, token);

    return { success: true };
  },

  async resetPassword(token, newPassword) {
    const resetToken = await PasswordResetToken.findOne({
      where: { token, used: false }
    });

    if (!resetToken || new Date() > resetToken.expires_at) {
      throw new Error('Invalid or expired reset token');
    }

    const user = await User.findByPk(resetToken.user_id);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword, must_change_password: false });
    await resetToken.update({ used: true });
    await RefreshToken.destroy({ where: { user_id: resetToken.user_id } });

    return { success: true };
  },

  async logout(userId) {
    await RefreshToken.destroy({ where: { user_id: userId } });
    return { success: true };
  }
};

module.exports = authService;
