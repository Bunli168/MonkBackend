const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RetreatRegistration = sequelize.define('RetreatRegistration', {
  retreat_event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'retreat_events',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  seating_row_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'seating_rows',
      key: 'id'
    }
  },
  seat_number: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'retreat_registrations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = RetreatRegistration;
