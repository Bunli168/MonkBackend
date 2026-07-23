const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PublicContent = sequelize.define('PublicContent', {
  title: { type: DataTypes.STRING(255), allowNull: false },
  content_type: { type: DataTypes.ENUM('video', 'photo', 'announcement'), allowNull: false },
  media_url: { type: DataTypes.STRING(255) },
  description: { type: DataTypes.TEXT },
  published_by: { type: DataTypes.INTEGER, allowNull: false },
  is_published: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'public_contents', createdAt: 'published_at', updatedAt: false });

module.exports = PublicContent;