const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./config/database');

async function migrate() {
  try {
    await sequelize.query('ALTER TABLE retreat_events ADD COLUMN is_closed TINYINT(1) DEFAULT 0;');
    console.log('Successfully added is_closed column');
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('Column already exists');
    } else {
      console.error(err);
    }
  }
  process.exit(0);
}

migrate();
