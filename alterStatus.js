require('dotenv').config();
const sequelize = require('./config/database');

async function alterTable() {
  try {
    const dialect = sequelize.getDialect();
    if (dialect === 'mysql') {
      await sequelize.query("ALTER TABLE event_participants MODIFY status VARCHAR(255) DEFAULT 'ASSIGNED'");
    } else if (dialect === 'postgres') {
      await sequelize.query("ALTER TABLE event_participants ALTER COLUMN status TYPE VARCHAR(255) USING status::text, ALTER COLUMN status SET DEFAULT 'ASSIGNED'");
    }
    console.log('Successfully altered status column to VARCHAR.');
  } catch (error) {
    console.error('Error altering table:', error);
  } finally {
    await sequelize.close();
  }
}

alterTable();
