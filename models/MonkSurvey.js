const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonkSurvey = sequelize.define('MonkSurvey', {
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
  
  // Preceptors and Ordination
  preceptor_name: { type: DataTypes.STRING(255) },
  first_assistant_name: { type: DataTypes.STRING(255) },
  second_assistant_name: { type: DataTypes.STRING(255) },
  ordained_name: { type: DataTypes.STRING(255) },
  ordained_date: { type: DataTypes.DATEONLY },
  
  // Place of Higher Ordination
  ordination_wat: { type: DataTypes.STRING(255) },
  ordination_province_id: { type: DataTypes.STRING(100) },
  ordination_district_id: { type: DataTypes.STRING(100) },
  ordination_commune_id: { type: DataTypes.STRING(100) },
  
  // Current Address
  current_wat: { type: DataTypes.STRING(255) },
  current_province_id: { type: DataTypes.STRING(100) },
  current_district_id: { type: DataTypes.STRING(100) },
  current_commune_id: { type: DataTypes.STRING(100) },
  
  // Contact
  phone_number: { type: DataTypes.STRING(50) }
}, {
  tableName: 'monk_surveys',
  timestamps: true
});

module.exports = MonkSurvey;
