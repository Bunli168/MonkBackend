const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  kut_id: { type: DataTypes.INTEGER, allowNull: true },
  reported_by: { type: DataTypes.INTEGER, allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  images: { type: DataTypes.JSON, allowNull: true },
  status: { type: DataTypes.ENUM('submitted', 'reviewed', 'resolved'), defaultValue: 'submitted' }
}, { tableName: 'reports', createdAt: 'submitted_at', updatedAt: false });

module.exports = Report;