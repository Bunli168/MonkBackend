const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinePayment = sequelize.define('FinePayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  cleared_absents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3
  },
  collected_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'fine_payments',
  timestamps: true,
  createdAt: 'payment_date',
  updatedAt: false
});

module.exports = FinePayment;
