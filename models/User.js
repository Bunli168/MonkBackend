const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role_id: { type: DataTypes.INTEGER, allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  email_verified_at: { type: DataTypes.DATE },
  verification_token: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM('active', 'inactive', 'pending'), defaultValue: 'pending' },
  token: { type: DataTypes.TEXT },
  phone: { type: DataTypes.STRING(255) },
  address: { type: DataTypes.STRING(255) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verification_expires: { type: DataTypes.DATE },
  last_login_at: { type: DataTypes.DATE },
  must_change_password: { type: DataTypes.BOOLEAN, defaultValue: false },
  totp_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  totp_secret: { type: DataTypes.STRING(255), allowNull: true },
  telegram_chat_id: { type: DataTypes.STRING(255), allowNull: true },
  telegram_username: { type: DataTypes.STRING(255), allowNull: true }
}, { tableName: 'users', createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = User;