const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const District = sequelize.define('District', {
  id: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  province_id: { type: DataTypes.STRING(100), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  name_en: { type: DataTypes.STRING(100) }
}, {
  tableName: 'districts',
  timestamps: true
});

module.exports = District;
