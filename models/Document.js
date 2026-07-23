const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  document_type: { type: DataTypes.ENUM('id_card', 'chhaya', 'student_card', 'other'), allowNull: false },
  file_path: { type: DataTypes.STRING(255), allowNull: false }
}, { tableName: 'documents', createdAt: 'uploaded_at', updatedAt: false });

module.exports = Document;