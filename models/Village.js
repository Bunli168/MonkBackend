const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Village = sequelize.define('Village', {
  id: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  commune_id: { type: DataTypes.STRING(100), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  name_en: { type: DataTypes.STRING(100) }
}, {
  tableName: 'villages',
  timestamps: true
});

module.exports = Village;
