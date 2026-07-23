const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commune = sequelize.define('Commune', {
  district_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  name_en: { type: DataTypes.STRING(100) }
}, {
  tableName: 'communes',
  timestamps: true
});

module.exports = Commune;
