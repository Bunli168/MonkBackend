const bcrypt = require('bcryptjs');
const { User, UserProfile, Address, Document, Role } = require('../models');
const { sendWelcomeEmail } = require('../utils/email');

const DEFAULT_PASSWORD = 'Neakavorn@123';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitFullName(name) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.slice(0, -1).join(' ') || parts[0];
  const lastName  = parts.length > 1 ? parts[parts.length - 1] : '';
  return { firstName, lastName };
}

function romanizeKhmer(str) {
  if (!str) return '';
  const mapping = {
    // Consonants
    'ក': 'k', 'ខ': 'kh', 'គ': 'k', 'ឃ': 'kh', 'ង': 'ng',
    'ច': 'ch', 'ឆ': 'ch', 'ជ': 'ch', 'ឈ': 'ch', 'ញ': 'nh',
    'ដ': 'd', 'ឋ': 'th', 'ឌ': 'd', 'ឍ': 'th', 'ណ': 'n',
    'ត': 't', 'ថ': 'th', 'ទ': 't', 'ធ': 'th', 'ន': 'n',
    'ប': 'b', 'ផ': 'ph', 'ព': 'p', 'ភ': 'ph', 'ម': 'm',
    'យ': 'y', 'រ': 'r', 'ល': 'l', 'វ': 'v',
    'ស': 's', 'ហ': 'h', 'ឡ': 'l', 'អ': 'a',
    'ឞ': 's', 'ឝ': 's',
    // Vowels
    'ា': 'a', 'ិ': 'i', 'ី': 'i', 'ឹ': 'oe', 'ឺ': 'eu',
    'ុ': 'u', 'ូ': 'ou', 'ួ': 'uo', 'ើ': 'eu', 'ឿ': 'oeu',
    'ៀ': 'ie', 'េ': 'e', 'ែ': 'ae', 'ៃ': 'ey', 'ោ': 'o',
    'ៅ': 'ao', 'ុំ': 'um', 'ំ': 'om', 'ាំ': 'am', 'ះ': 'ah',
    'េះ': 'eh', 'ោះ': 'ah', 'ុះ': 'os'
  };
  
  let res = '';
  for (const char of str) {
    res += mapping[char] || char;
  }
  return res;
}

function slugify(str) {
  const romanized = romanizeKhmer(str);
  return romanized
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, '');      // keep letters and digits only
}

async function generateUniqueEmail(firstName, lastName) {
  const first  = slugify(firstName) || 'user';
  const last   = slugify(lastName)  || 'user';
  const base   = `${first}.${last}`;
  const domain = process.env.EMAIL_DOMAIN || 'pagoda.kh';

  let candidate = `${base}@${domain}`;
  let counter   = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await User.findOne({ where: { email: candidate } });
    if (!existing) return candidate;
    candidate = `${base}${counter}@${domain}`;
    counter++;
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

const userService = {

  /**
   * Admin / SuperAdmin / Mekudi registers a new member.
   *
   * Two modes depending on what the frontend sends:
   *
   * MODE 1 — Custom Email (admin provides exact email):
   *   { email, roleId }
   *
   * MODE 2 — Auto Generate (system creates email from name):
   *   { name, dob, gender, pob, roleId }
   *
   * Default password is always: Neakavorn@123
   * must_change_password is set to true so user must change on first login.
   */
  async registerUser(data, creatorId, creatorUser) {
    const { email, dob, gender, pob, roleId, role_id } = data;

    let resolvedName = data.name;
    if (!resolvedName && (data.first_name_kh || data.firstNameKh || data.firstName)) {
      const f = data.first_name_kh || data.firstNameKh || data.firstName || '';
      const l = data.last_name_kh || data.lastNameKh || data.lastName || '';
      resolvedName = `${l} ${f}`.trim();
    }

    // Accept either roleId (frontend snake_case) or role_id
    let resolvedRoleId = roleId || role_id;
    if (!resolvedRoleId) throw new Error('role_id is required');
    resolvedRoleId = parseInt(resolvedRoleId, 10);

    const role = await Role.findByPk(resolvedRoleId);
    if (!role) throw new Error('Invalid role');

    const isSuperAdmin = resolvedRoleId === 1;
    const generatedPassword = isSuperAdmin 
      ? require('crypto').randomBytes(4).toString('hex') + 'Aa@1'
      : DEFAULT_PASSWORD;
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const rawSeatingRowId = data.seating_row_id ?? data.seatingRowId ?? null;
    const seatingRowIdVal = rawSeatingRowId === null || rawSeatingRowId === undefined || rawSeatingRowId === ''
      ? null
      : Number(rawSeatingRowId);

    let loginEmail;
    let firstName = '';
    let lastName  = '';
    const emailLower = email ? email.toLowerCase().trim() : null;
    const seatNumberVal = data.seat_number ? String(data.seat_number).trim() : null;

    const isSuperAdminCreator = !creatorUser || creatorUser.role_id === 1 || (creatorUser.Role && creatorUser.Role.name === 'SuperAdmin');
    if (emailLower && isSuperAdminCreator) {
      // ── MODE 1: Custom Email ──────────────────────────────────────────────
      const existing = await User.findOne({ where: { email: emailLower } });
      if (existing) {
        if (creatorId && existing.id === creatorId) {
          const [profile, created] = await UserProfile.findOrCreate({
            where: { user_id: existing.id },
            defaults: {
              user_id: existing.id,
              seating_row_id: seatingRowIdVal,
              seat_number: seatNumberVal
            }
          });

          if (!created) {
            await profile.update({
              seating_row_id: seatingRowIdVal,
              seat_number: seatNumberVal
            });
          }

          return existing;
        }

        throw new Error('Email already in use');
      }

      loginEmail = emailLower;

      const [localPart] = loginEmail.split('@');
      const nameParts   = localPart.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1));
      firstName = nameParts[0] || '';
      lastName  = nameParts.slice(1).join(' ') || '';
    } else if (resolvedName) {
      // ── MODE 2: Auto Generate ─────────────────────────────────────────────
      if (resolvedRoleId === 1) {
        throw new Error('Super Admin cannot be auto-generated. Please provide an email address.');
      }
      const split = splitFullName(resolvedName);
      firstName   = split.firstName;
      lastName    = split.lastName;
      loginEmail  = await generateUniqueEmail(firstName, lastName);
    } else {
      throw new Error('Either email or name is required');
    }

    // Enforce Mekudi's Kudi ID if creator is Mekudi
    let assignedKutId = data.kut_id || null;
    const isCreatorAdmin = creatorUser && (creatorUser.role_id === 2 || (creatorUser.Role && creatorUser.Role.name === 'Admin'));
    if (isCreatorAdmin && creatorUser.UserProfile?.kut_id) {
        assignedKutId = creatorUser.UserProfile.kut_id;
    }

    if (seatingRowIdVal !== null) {
      const { SeatingRow } = require('../models');
      const seatingRow = await SeatingRow.findByPk(seatingRowIdVal);
      if (!seatingRow) {
        throw new Error('Invalid seating row');
      }
      if (assignedKutId && seatingRow.kut_id && Number(seatingRow.kut_id) !== Number(assignedKutId)) {
        throw new Error('Selected seating row does not belong to the selected kut');
      }

      // Seat capacity and duplicate validation
      if (data.seat_number) {
        data.seat_number = String(data.seat_number).trim();
        const seatNumInt = parseInt(data.seat_number, 10);
        if (isNaN(seatNumInt) || seatNumInt < 1 || seatNumInt > seatingRow.capacity) {
          throw new Error(`Invalid seat number. Row ${seatingRow.row_num} only has ${seatingRow.capacity} seats.`);
        }

        const { UserProfile } = require('../models');
        const existingOccupant = await UserProfile.findOne({
          where: {
            seating_row_id: seatingRowIdVal,
            seat_number: String(data.seat_number).trim()
          }
        });

        if (existingOccupant) {
          throw new Error('This seat is already occupied by another Monk. Please choose an empty seat.');
        }
      }
    }

    // Create user record
    const verificationToken = isSuperAdmin ? require('uuid').v4() : null;

    const user = await User.create({
      email:                loginEmail,
      password:             hashedPassword,
      role_id:              resolvedRoleId,
      is_active:            true,
      is_verified:          !isSuperAdmin,
      email_verified_at:    isSuperAdmin ? null : new Date(),
      verification_token:   verificationToken,
      status:               'active',
      must_change_password: true
    });

    // Sanitize profile values to prevent empty string violations or unique constraint crashes
    const sanitizedFirstNameKh = (data.first_name_kh || data.firstNameKh || firstName || lastName || '-').trim();
    const sanitizedLastNameKh = (data.last_name_kh || data.lastNameKh || lastName || firstName || '-').trim();
    
    let dobVal = dob || data.date_of_birth || null;
    if (dobVal && isNaN(Date.parse(dobVal))) {
      dobVal = null;
    }

    const rawChhaya = (data.chhaya_number || '').trim();
    const chhayaVal = rawChhaya === '' ? null : rawChhaya;

    const rawPhone = (data.phone_number || data.phone || '').trim();
    const phoneVal = rawPhone === '' ? null : rawPhone;

    const rawSchool = (data.university_name || data.school || '').trim();
    const schoolVal = rawSchool === '' ? null : rawSchool;

    const rawYear = (data.university_year || data.year || '').trim();
    const yearVal = rawYear === '' ? null : rawYear;

    const rawGender = (gender || data.gender || '').trim();
    const genderVal = rawGender === '' ? null : rawGender;

    const watVal = (data.from_wat || data.wat || '').trim();

    // Create profile record
    await UserProfile.create({
      user_id:       user.id,
      first_name_en: firstName || '',
      last_name_en:  lastName  || '',
      first_name_kh: sanitizedFirstNameKh,
      last_name_kh:  sanitizedLastNameKh,
      date_of_birth: dobVal,
      phone_number:  phoneVal,
      chhaya_number: chhayaVal,
      university_name: schoolVal,
      university_year: yearVal,
      gender:        genderVal,
      kut_id:        assignedKutId,
      from_wat:      watVal || null,
      seating_row_id: seatingRowIdVal,
      seat_number:   data.seat_number ? String(data.seat_number).trim() : null
    });

    // Create address if provided
    if (data.province || data.district || data.commune || data.village) {
      const { Address } = require('../models');
      await Address.create({
        user_id: user.id,
        address_type: 'birth_place',
        province: data.province || '',
        district: data.district || '',
        commune: data.commune || '',
        village: data.village || ''
      });
    }

    // Send welcome email if there is a personal_email or fallback to login email
    const emailTarget = data.personal_email || loginEmail;
    const fullName    = [firstName, lastName].filter(Boolean).join(' ');
    sendWelcomeEmail(emailTarget, loginEmail, generatedPassword, fullName, verificationToken)
      .catch(e => console.warn('Welcome email failed (non-fatal):', e.message));

    // Send Telegram Notification to Super Admins & Admins
    try {
      const telegramBot = require('./memberTelegramBot') || require('./telegramBot');
      if (telegramBot && telegramBot.sendMessage) {
        const { Op } = require('sequelize');
        const notifyUsers = await User.findAll({ 
          where: { 
            role_id: { [Op.in]: [1, 2] }, 
            telegram_chat_id: { [Op.not]: null } 
          } 
        });
        const roleLabels = {
          'SUPERADMIN': 'មេដឹកនាំ (Super Admin)',
          'ADMIN': 'មេកុដិ (Admin)',
          'MONK': 'ព្រះសង្ឃ (Monk)',
          'BHIKKHU': 'ភិក្ខុ (Bhikkhu)',
          'STUDENT': 'និស្សិត (Student)',
          'MEKUDI': 'មេកុដិ (Mekudi)'
        };
        const roleStr = roleLabels[(role.name || '').toUpperCase()] || role.name;
        const creatorName = creatorUser ? (creatorUser.name || creatorUser.email) : (creatorId ? `ID: ${creatorId}` : 'System Admin');
        const memberName = `${sanitizedLastNameKh} ${sanitizedFirstNameKh}`.trim();
        const phoneStr = phoneVal ? phoneVal : 'មិនមាន (N/A)';
        let kutNameStr = 'មិនមាន (N/A)';
        if (assignedKutId) {
          try {
            const { Kut } = require('../models');
            const kutObj = await Kut.findByPk(assignedKutId);
            if (kutObj) kutNameStr = kutObj.name;
            else kutNameStr = `កុដិលេខ ${assignedKutId}`;
          } catch (err) {
            kutNameStr = `កុដិលេខ ${assignedKutId}`;
          }
        }
        
        const notifyText = `🎉 *មានសមាជិកថ្មីចុះឈ្មោះ! (New Member Registered)*\n\n` +
          `👤 *ឈ្មោះ ៖* ${memberName}\n` +
          `🏷 *តួនាទី ៖* ${roleStr}\n` +
          `🏠 *កុដិ ៖* ${kutNameStr}\n` +
          `📧 *អ៊ីមែល ៖* ${loginEmail}\n` +
          `📱 *លេខទូរស័ព្ទ ៖* ${phoneStr}\n` +
          `👨‍💼 *ចុះឈ្មោះដោយ ៖* ${creatorName}\n` +
          `⏰ *កាលបរិច្ឆេទ ៖* ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`;

        const sentChatIds = new Set();
        for (const u of notifyUsers) {
          if (u.id !== user.id && u.telegram_chat_id && !sentChatIds.has(u.telegram_chat_id)) {
            sentChatIds.add(u.telegram_chat_id);
            telegramBot.sendMessage(u.telegram_chat_id, notifyText, { parse_mode: 'Markdown' }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn('Telegram notification failed (non-fatal):', e.message);
    }

    return {
      id:              user.id,
      generated_email: loginEmail,
      role:            role.name,
      must_change_password: true,
      created_by:      creatorId
    };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Existing methods (unchanged)
  // ──────────────────────────────────────────────────────────────────────────

  async getAllUsers(options = {}) {
    const { Op } = require('sequelize');
    const { search, isActive, isVerified, roleId, roleIds, page = 1, perPage = 10, sortBy = 'created_at', sortOrder = 'DESC', requestingUser } = options;

    // Parse roleIds: comma-separated string or array → array of ints
    const parsedRoleIds = roleIds
      ? String(roleIds).split(',').map(r => parseInt(r.trim(), 10)).filter(Boolean)
      : null;

    const where = {};
    const userProfileWhere = {};

    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.is_active = isActive === 'true' || isActive === true;
    }

    if (isVerified !== undefined && isVerified !== null && isVerified !== '') {
      where.is_verified = isVerified === 'true' || isVerified === true;
    }

    // Authorization logic for Mekudi (Role ID 2)
    if (requestingUser && requestingUser.role_id === 2) {
      const allowedRoles = [2, 3, 4, 7];
      if (parsedRoleIds) {
        const filtered = parsedRoleIds.filter(r => allowedRoles.includes(r));
        where.role_id = { [Op.in]: filtered.length ? filtered : [] };
      } else if (roleId) {
        if (!allowedRoles.includes(parseInt(roleId, 10))) {
          where.role_id = { [Op.in]: [] };
        } else {
          where.role_id = roleId;
        }
      } else {
        where.role_id = { [Op.in]: allowedRoles };
      }

      if (requestingUser.UserProfile && requestingUser.UserProfile.kut_id) {
        userProfileWhere.kut_id = requestingUser.UserProfile.kut_id;
      } else {
        userProfileWhere.kut_id = null;
      }
    } else {
      if (parsedRoleIds) {
        where.role_id = { [Op.in]: parsedRoleIds };
      } else if (roleId) {
        where.role_id = roleId;
      } else if (options.includeTakers !== 'true' && options.includeTakers !== true) {
        const excludeRoles = await require('../models').Role.findAll({ 
          where: { name: { [Op.in]: ['AttendanceTaker', 'SuperAdmin'] } } 
        });
        if (excludeRoles && excludeRoles.length > 0) {
          const excludeIds = excludeRoles.map(r => r.id);
          where.role_id = { [Op.notIn]: excludeIds };
        }
      }
      if (options.kutId) {
        userProfileWhere.kut_id = options.kutId;
      }
    }

    const { Kut } = require('../models');
    const include = [
      { model: Role },
      { 
        model: UserProfile, 
        where: Object.keys(userProfileWhere).length ? userProfileWhere : undefined,
        include: [{ model: Kut }]
      }
    ];

    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { '$UserProfile.first_name_en$': { [Op.like]: `%${search}%` } },
        { '$UserProfile.last_name_en$': { [Op.like]: `%${search}%` } },
        { '$UserProfile.first_name_kh$': { [Op.like]: `%${search}%` } },
        { '$UserProfile.last_name_kh$': { [Op.like]: `%${search}%` } }
      ];
    }

    const limit = parseInt(perPage, 10) || 10;
    const offset = (parseInt(page, 10) - 1) * limit;

    let orderClause = [['created_at', 'DESC']];
    if (requestingUser && requestingUser.role_id === 2) {
      orderClause = [
        [require('sequelize').literal('CASE WHEN "User"."role_id" = 2 THEN 1 WHEN "User"."role_id" = 7 THEN 2 WHEN "User"."role_id" = 3 THEN 3 ELSE 4 END'), 'ASC'],
        ['created_at', 'DESC']
      ];
    } else if (parsedRoleIds && parsedRoleIds.includes(3) && parsedRoleIds.includes(7)) {
      orderClause = [
        ['role_id', 'DESC'],
        [UserProfile, 'kut_id', 'ASC'],
        ['created_at', 'DESC']
      ];
    }

    if (sortBy && sortBy !== 'undefined') {
      const sOrder = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      if (sortBy === 'createdAt') {
        if (requestingUser && requestingUser.role_id === 2) {
          orderClause = [
            [require('sequelize').literal('CASE WHEN "User"."role_id" = 2 THEN 1 WHEN "User"."role_id" = 7 THEN 2 WHEN "User"."role_id" = 3 THEN 3 ELSE 4 END'), 'ASC'],
            ['created_at', sOrder]
          ];
        } else if (parsedRoleIds && parsedRoleIds.includes(3) && parsedRoleIds.includes(7)) {
          orderClause = [
            ['role_id', 'DESC'],
            [UserProfile, 'kut_id', 'ASC'],
            ['created_at', sOrder]
          ];
        } else {
          orderClause = [['created_at', sOrder]];
        }
      } else if (sortBy === 'username') {
        orderClause = [[UserProfile, 'first_name_kh', sOrder]];
      } else if (sortBy === 'email') {
        orderClause = [['email', sOrder]];
      } else {
        const userAttributes = Object.keys(User.rawAttributes);
        if (userAttributes.includes(sortBy)) {
          orderClause = [[sortBy, sOrder]];
        }
      }
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: orderClause,
      distinct: true
    });

    const formattedUsers = rows.map(user => {
      const u = user.toJSON();
      let firstName = u.UserProfile?.first_name_en || u.UserProfile?.first_name_kh || '';
      let lastName = u.UserProfile?.last_name_en || u.UserProfile?.last_name_kh || '';
      
      if (!firstName && !lastName && u.email) {
        const [localPart] = u.email.split('@');
        const nameParts = localPart.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1));
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      return {
        id: u.id,
        email: u.email,
        firstName,
        lastName,
        role: u.Role ? { id: u.Role.id, name: u.Role.name } : null,
        isActive: u.is_active,
        dob: u.UserProfile?.date_of_birth || null,
        gender: u.UserProfile?.gender || null,
        pob: null, // Add pob if added to db later
        createdAt: u.created_at,
        profile: { 
          avatarUrl: u.UserProfile?.avatar_url,
          phone: u.UserProfile?.phone_number || '',
          university_name: u.UserProfile?.university_name || '',
          university_year: u.UserProfile?.university_year || '',
          kut: u.UserProfile?.Kut ? { id: u.UserProfile.Kut.id, name: u.UserProfile.Kut.name, description: u.UserProfile.Kut.description } : null,
          seating_row_id: u.UserProfile?.seating_row_id || null,
          seat_number: u.UserProfile?.seat_number || null
        }
      };
    });

    return {
      users: formattedUsers,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
        perPage: limit
      }
    };
  },

  async getUserFullProfile(userId) {
    const { Kut } = require('../models');
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'verification_token'] },
      include: [
        { model: Role,        attributes: ['name'] },
        { 
          model: UserProfile,
          include: [{ model: Kut }]
        },
        { model: Address },
        { model: Document }
      ]
    });

    if (!user) throw new Error('User not found');
    return user;
  },

  async updateUserProfile(userId, profileData) {
    if (profileData.seat_number !== undefined) {
      if (profileData.seat_number === null || profileData.seat_number === '') {
        profileData.seat_number = null;
      } else {
        profileData.seat_number = String(profileData.seat_number).trim();
      }
    }
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const models = require('../models');

    // --- SEAT VALIDATION ---
    const existingProfile = await models.UserProfile.findOne({ where: { user_id: userId } });
    const finalRowId = profileData.seating_row_id !== undefined ? profileData.seating_row_id : (existingProfile?.seating_row_id || null);
    const finalSeatNum = profileData.seat_number !== undefined ? profileData.seat_number : (existingProfile?.seat_number || null);

    if (profileData.seating_row_id !== undefined || profileData.seat_number !== undefined) {
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

    const [profile, created] = await UserProfile.findOrCreate({
      where:    { user_id: userId },
      defaults: { user_id: userId, ...profileData }
    });

    if (!created) await profile.update(profileData);

    return await UserProfile.findOne({ where: { user_id: userId } });
  },

  async addUserAddress(userId, addressData) {
    return await Address.create({ user_id: userId, ...addressData });
  },

  async updateUserAddress(addressId, userId, addressData) {
    const address = await Address.findOne({ where: { id: addressId, user_id: userId } });
    if (!address) throw new Error('Address not found or does not belong to user');
    return await address.update(addressData);
  },

  async deleteUserAddress(addressId, userId) {
    const address = await Address.findOne({ where: { id: addressId, user_id: userId } });
    if (!address) throw new Error('Address not found or does not belong to user');
    await address.destroy();
    return { message: 'Address deleted successfully' };
  },

  async addUserDocument(userId, documentData) {
    return await Document.create({ user_id: userId, ...documentData });
  },

  async deleteUserDocument(documentId, userId) {
    const doc = await Document.findOne({ where: { id: documentId, user_id: userId } });
    if (!doc) throw new Error('Document not found or does not belong to user');
    await doc.destroy();
    return { message: 'Document deleted successfully' };
  }
};

module.exports = userService;
