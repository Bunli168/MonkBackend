const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  row_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'attendance_rows', key: 'id' } },
  seating_row_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'seating_rows', key: 'id' } },
  seat_number: { type: DataTypes.STRING(50) },
  kut_id: { type: DataTypes.INTEGER, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('present', 'absent', 'permission'), allowNull: false, defaultValue: 'present' },
  notes: { type: DataTypes.TEXT },
  fine_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  education_year_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'education_years',
      key: 'id'
    }
  },
  retreat_event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'retreat_events',
      key: 'id'
    }
  }
}, {
  tableName: 'attendances',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['user_id', 'date'] }
  ]
});

module.exports = Attendance;
