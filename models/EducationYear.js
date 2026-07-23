const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EducationYear = sequelize.define('EducationYear', {
  year: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'education_years',
  timestamps: true
});

module.exports = EducationYear;
