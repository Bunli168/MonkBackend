const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(err => ({
          msg: err.message,
          path: err.path.join('.')
        }))
      });
    }
    
    req.body = value; // Attach validated (and normalized) data back to req.body
    next();
  };
};

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Valid email is required',
    'any.required': 'Valid email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
    'string.empty': 'Password is required'
  })
});

// Accepts both frontend modes:
// Mode 1 — Custom Email: { email, roleId }
// Mode 2 — Auto Generate: { name, dob, gender, pob, roleId }
const adminRegisterUserSchema = Joi.object({
  // Mode 1: admin provides exact email
  email: Joi.string().email().lowercase().optional(),

  // Mode 2: system generates email from name
  name: Joi.string().trim().min(2).optional(),
  dob: Joi.string().optional().allow(null, ''),
  gender: Joi.string().valid('Male', 'Female').optional().allow(null, ''),
  pob: Joi.string().trim().optional().allow(null, ''),

  // Khmer names (optional supplement for Mode 2)
  first_name_kh: Joi.string().trim().optional().allow(null, ''),
  last_name_kh:  Joi.string().trim().optional().allow(null, ''),
  firstNameKh:   Joi.string().trim().optional().allow(null, ''),
  lastNameKh:    Joi.string().trim().optional().allow(null, ''),

  // Additional biography fields
  chhaya_number:   Joi.string().trim().optional().allow(null, ''),
  phone_number:    Joi.string().trim().optional().allow(null, ''),
  phone:           Joi.string().trim().optional().allow(null, ''),
  university_name: Joi.string().trim().optional().allow(null, ''),
  school:          Joi.string().trim().optional().allow(null, ''),
  university_year: Joi.string().trim().optional().allow(null, ''),
  year:            Joi.string().trim().optional().allow(null, ''),
  from_wat:        Joi.string().trim().optional().allow(null, ''),
  wat:             Joi.string().trim().optional().allow(null, ''),

  // Address fields
  commune:         Joi.string().trim().optional().allow(null, ''),
  district:        Joi.string().trim().optional().allow(null, ''),
  province:        Joi.string().trim().optional().allow(null, ''),
  village:         Joi.string().trim().optional().allow(null, ''),

  // Common
  roleId:  Joi.number().integer().optional(),
  role_id: Joi.number().integer().optional(),
  kut_id:  Joi.number().integer().optional().allow(null),
  personal_email: Joi.string().email().lowercase().optional().allow(null, '')
}).or('email', 'name')            // one of email OR name required
  .or('roleId', 'role_id');       // one of roleId OR role_id required

const otpSchema = Joi.object({
  otpCode: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must be numeric',
    'any.required': 'OTP code is required',
    'string.empty': 'OTP code is required'
  }),
  otpSessionToken: Joi.string().required().messages({
    'any.required': 'Session token is required',
    'string.empty': 'Session token is required'
  })
});

const changePasswordSchema = Joi.object({
  // ✅ Optional token field: used by body-based route (more secure than URL param)
  token: Joi.string().optional().allow(''),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
    'any.required': 'New password is required',
    'string.empty': 'New password is required'
  }),
  confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  })
});

const totpSchema = Joi.object({
  token: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'TOTP must be 6 digits',
    'string.pattern.base': 'TOTP must be numeric',
    'any.required': 'TOTP token is required',
    'string.empty': 'TOTP token is required'
  })
});

const totpSetupSchema = Joi.object({
  token: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'TOTP must be 6 digits',
    'string.pattern.base': 'TOTP must be numeric',
    'any.required': 'TOTP token is required',
    'string.empty': 'TOTP token is required'
  }),
  secret: Joi.string().required().messages({
    'any.required': 'TOTP secret is required',
    'string.empty': 'TOTP secret is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Valid email is required',
    'any.required': 'Valid email is required',
    'string.empty': 'Valid email is required'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
    'string.empty': 'Reset token is required'
  }),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
    'any.required': 'New password is required',
    'string.empty': 'New password is required'
  }),
  confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  })
});

const leaveRequestSchema = Joi.object({
  start_date: Joi.date().iso().required().messages({
    'date.format': 'Start date must be in YYYY-MM-DD format',
    'any.required': 'Start date is required'
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
    'date.format': 'End date must be in YYYY-MM-DD format',
    'date.min': 'End date must be after or equal to start date',
    'any.required': 'End date is required'
  }),
  reason: Joi.string().trim().max(1000).required().messages({
    'string.max': 'Reason cannot exceed 1000 characters',
    'any.required': 'Reason is required'
  })
});

const updateProfileSchema = Joi.object({
  first_name_kh: Joi.string().trim().max(100).allow(null, ''),
  last_name_kh: Joi.string().trim().max(100).allow(null, ''),
  first_name_en: Joi.string().trim().max(100).allow(null, ''),
  last_name_en: Joi.string().trim().max(100).allow(null, ''),
  date_of_birth: Joi.date().iso().allow(null, ''),
  phone_number: Joi.string().trim().max(20).allow(null, ''),
  chhaya_number: Joi.string().trim().max(50).allow(null, ''),
  gender: Joi.string().valid('Male', 'Female').allow(null, ''),
  university_name: Joi.string().trim().max(200).allow(null, ''),
  university_year: Joi.string().trim().max(50).allow(null, ''),
  from_wat: Joi.string().trim().max(200).allow(null, ''),
  seating_row_id: Joi.number().integer().allow(null, ''),
  seat_number: Joi.string().trim().max(50).allow(null, ''),
  avatar_url: Joi.string().trim().uri().allow(null, '')
}).unknown(false); // Disallow any fields not explicitly listed

const attendanceSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  kut_id: Joi.number().integer().allow(null),
  date: Joi.date().iso().required(),
  status: Joi.string().valid('present', 'absent', 'permission').allow(null, ''),
  notes: Joi.string().trim().max(1000).allow(null, ''),
  seating_row_id: Joi.number().integer().allow(null),
  seat_number: Joi.string().trim().max(50).allow(null, ''),
  fine_amount: Joi.number().min(0).allow(null)
}).unknown(false);

const bulkAttendanceSchema = Joi.object({
  attendances: Joi.array().items(attendanceSchema).min(1).required()
}).unknown(false);

const submitLeaveRequestSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  kut_id: Joi.number().integer().required(),
  date: Joi.date().iso().required(),
  notes: Joi.string().trim().max(1000).allow(null, '')
}).unknown(false);

const kutSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(1000).allow(null, '')
}).unknown(false);

const seatingRowSchema = Joi.object({
  row_num: Joi.string().trim().max(50).required(),
  capacity: Joi.number().integer().min(1).required(),
  kut_id: Joi.number().integer().required(),
  assigned_taker_id: Joi.number().integer().allow(null)
}).unknown(false);

const reportSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(5000).required(),
  report_category_id: Joi.number().integer().required(),
  media_url: Joi.string().trim().uri().allow(null, '')
}).unknown(false);

const publicContentSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  content: Joi.string().trim().max(10000).required(),
  type: Joi.string().valid('news', 'announcement', 'event', 'article').required(),
  media_url: Joi.string().trim().uri().allow(null, ''),
  is_published: Joi.boolean().default(false)
}).unknown(false);

module.exports = {
  loginValidation: validate(loginSchema),
  adminRegisterUserValidation: validate(adminRegisterUserSchema),
  otpValidation: validate(otpSchema),
  changePasswordValidation: validate(changePasswordSchema),
  totpValidation: validate(totpSchema),
  totpSetupValidation: validate(totpSetupSchema),
  forgotPasswordValidation: validate(forgotPasswordSchema),
  resetPasswordValidation: validate(resetPasswordSchema),
  leaveRequestValidation: validate(leaveRequestSchema),
  updateProfileValidation: validate(updateProfileSchema),
  attendanceValidation: validate(attendanceSchema),
  bulkAttendanceValidation: validate(bulkAttendanceSchema),
  submitLeaveRequestValidation: validate(submitLeaveRequestSchema),
  kutValidation: validate(kutSchema),
  seatingRowValidation: validate(seatingRowSchema),
  reportValidation: validate(reportSchema),
  publicContentValidation: validate(publicContentSchema)
};
