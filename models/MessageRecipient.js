const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageRecipient = sequelize.define('MessageRecipient', {
  message_id: { type: DataTypes.INTEGER, allowNull: false },
  receiver_id: { type: DataTypes.INTEGER, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: { type: DataTypes.DATE }
}, { tableName: 'message_recipients', timestamps: false });

module.exports = MessageRecipient;