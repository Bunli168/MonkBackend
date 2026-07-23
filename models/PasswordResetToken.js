const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  token: { type: DataTypes.STRING(255), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'password_reset_tokens', createdAt: 'created_at', updatedAt: false });

module.exports = PasswordResetToken;