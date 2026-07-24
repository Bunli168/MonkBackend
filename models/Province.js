const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Province = sequelize.define('Province', {
  id: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  name_en: { type: DataTypes.STRING(100) }
}, {
  tableName: 'provinces',
  timestamps: true
});

module.exports = Province;
