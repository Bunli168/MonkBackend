const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttendanceRow = sequelize.define('AttendanceRow', {
  kut_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'kuts', key: 'id' }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  taker_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'attendance_rows',
  underscored: true
});


module.exports = AttendanceRow;


