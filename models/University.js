const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const University = sequelize.define('University', {
  name: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  commune: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  village: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tel: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  rector: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  establish_date: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  faculties: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'universities',
  timestamps: true
});

module.exports = University;
