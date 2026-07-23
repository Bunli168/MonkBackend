const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  amount_paid: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  paid_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
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
  },
  collected_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;
