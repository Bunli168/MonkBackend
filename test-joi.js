const Joi = require('joi');
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
}).unknown(false);

const body = {
    seating_row_id: 1,
    seat_number: 12
};
const { error } = updateProfileSchema.validate(body);
console.log(error ? error.details : "Success");
