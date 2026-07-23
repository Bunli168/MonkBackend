const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kut = sequelize.define('Kut', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT }
}, { tableName: 'kuts', createdAt: 'created_at', updatedAt: false });

module.exports = Kut;