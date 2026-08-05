const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CeremonyEvent = sequelize.define('CeremonyEvent', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  event_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  event_time: {
    type: DataTypes.TIME
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'ceremony_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = CeremonyEvent;
