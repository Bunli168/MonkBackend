const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeatingRow = sequelize.define('SeatingRow', {
  row_num: { type: DataTypes.INTEGER, allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  assigned_taker_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'seating_rows',
  timestamps: true
});

module.exports = SeatingRow;
