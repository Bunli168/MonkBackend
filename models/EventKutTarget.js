const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventKutTarget = sequelize.define('EventKutTarget', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ceremony_events',
      key: 'id'
    }
  },
  kut_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'kuts',
      key: 'id'
    }
  },
  requested_monks_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('PENDING_MEKUDI', 'FULFILLED'),
    defaultValue: 'PENDING_MEKUDI'
  }
}, {
  tableName: 'event_kut_targets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = EventKutTarget;
