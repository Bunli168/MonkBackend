const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  address_type: {
    type: DataTypes.ENUM('birth_place', 'current_place'),
    defaultValue: 'birth_place'
  },
  province_id: { type: DataTypes.STRING(100) },
  district_id: { type: DataTypes.STRING(100) },
  commune_id:  { type: DataTypes.STRING(100) },
  village_id:  { type: DataTypes.STRING(100) },
  province: { type: DataTypes.STRING(255) },
  district: { type: DataTypes.STRING(255) },
  commune: { type: DataTypes.STRING(255) },
  village:  { type: DataTypes.STRING(100) }
}, {
  tableName: 'addresses',
  timestamps: false
});

module.exports = Address;
