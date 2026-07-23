const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
  user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  kut_id: { type: DataTypes.INTEGER },
  first_name_kh: { type: DataTypes.STRING(100), allowNull: false },
  last_name_kh: { type: DataTypes.STRING(100), allowNull: false },
  first_name_en: { type: DataTypes.STRING(100) },
  last_name_en: { type: DataTypes.STRING(100) },
  phone_number: { type: DataTypes.STRING(20) },
  chhaya_number: { type: DataTypes.STRING(50), unique: true },
  university_name: { type: DataTypes.STRING(255) },
  university_year: { type: DataTypes.STRING(50) },
  place_of_birth: { type: DataTypes.STRING(255) },
  date_of_birth: { type: DataTypes.DATEONLY },
  ordained_date: { type: DataTypes.DATEONLY },
  avatar_url: { type: DataTypes.STRING(255) },
  seat_number: { type: DataTypes.STRING(50) },
  bio: { type: DataTypes.TEXT },
  gender: { type: DataTypes.STRING(50) },
  from_wat: { type: DataTypes.STRING(255) },
  seating_row_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'seating_rows', key: 'id' } }
}, { 
  tableName: 'user_profiles', 
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['seating_row_id', 'seat_number']
    }
  ]
});

module.exports = UserProfile;