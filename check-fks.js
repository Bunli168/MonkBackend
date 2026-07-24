const { sequelize } = require('./models');

async function check() {
  try {
     const [results] = await sequelize.query(`
        SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME IN ('provinces', 'districts', 'communes', 'villages');
     `);
     console.log(results);
  } catch (e) {
     console.error(e);
  }
  process.exit(0);
}
check();
