const { Sequelize } = require('sequelize');
const sequelize = require('./config/database');

async function alterTable() {
  try {
    await sequelize.query('ALTER TABLE attendances MODIFY kut_id INT NULL');
    console.log('Successfully altered attendances table');
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    process.exit();
  }
}
alterTable();
