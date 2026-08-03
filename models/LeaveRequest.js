const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  retreat_event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'pending_mekudi', 'pending_superadmin', 'approved', 'rejected'),
    defaultValue: 'pending_mekudi',
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'leave_requests',
  timestamps: true,
});

module.exports = LeaveRequest;
