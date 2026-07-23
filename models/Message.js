const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  sender_id: { type: DataTypes.INTEGER, allowNull: false },
  subject: { type: DataTypes.STRING(255), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  is_broadcast: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'messages', createdAt: 'sent_at', updatedAt: false });

module.exports = Message;