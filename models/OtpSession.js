const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtpSession = sequelize.define('OtpSession', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  session_token: { type: DataTypes.STRING(255), allowNull: false },
  otp_code: { type: DataTypes.STRING(10), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'otp_sessions', createdAt: 'created_at', updatedAt: false });

module.exports = OtpSession;