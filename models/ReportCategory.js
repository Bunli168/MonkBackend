const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportCategory = sequelize.define('ReportCategory', {
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  color: { type: DataTypes.STRING(50) } // For UI styling, optional
}, { 
  tableName: 'report_categories', 
  timestamps: true 
});

module.exports = ReportCategory;
