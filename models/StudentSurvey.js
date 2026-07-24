const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentSurvey = sequelize.define('StudentSurvey', {
  user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  
  // Basic Info
  surname_name: { type: DataTypes.STRING(255) },
  nationality: { type: DataTypes.STRING(100), defaultValue: 'KHMER' },
  date_of_birth: { type: DataTypes.DATEONLY },
  
  // Place of Birth
  pob_province_id: { type: DataTypes.STRING(100) },
  pob_district_id: { type: DataTypes.STRING(100) },
  pob_commune_id: { type: DataTypes.STRING(100) },
  pob_village_id: { type: DataTypes.STRING(100) },
  
  // Contact
  phone_number: { type: DataTypes.STRING(50) },
  id_card_number: { type: DataTypes.STRING(100) },
  other_number: { type: DataTypes.STRING(100) },
  
  // Education & Job
  edu_level: { type: DataTypes.STRING(255) },
  edu_school: { type: DataTypes.STRING(255) },
  edu_specialty: { type: DataTypes.STRING(255) },
  edu_grade: { type: DataTypes.STRING(255) },
  current_job: { type: DataTypes.STRING(255) },
  kudi_number: { type: DataTypes.STRING(100) },
  
  // Parents' Info
  father_name: { type: DataTypes.STRING(255) },
  father_occupation: { type: DataTypes.STRING(255) },
  mother_name: { type: DataTypes.STRING(255) },
  mother_occupation: { type: DataTypes.STRING(255) },
  parents_province_id: { type: DataTypes.STRING(100) },
  parents_district_id: { type: DataTypes.STRING(100) },
  parents_commune_id: { type: DataTypes.STRING(100) },
  parents_village_id: { type: DataTypes.STRING(100) }
}, {
  tableName: 'student_surveys',
  timestamps: true
});

module.exports = StudentSurvey;
