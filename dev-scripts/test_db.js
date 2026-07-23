const sequelize = require('./config/database');
async function check() {
  const [results] = await sequelize.query('DESCRIBE users;');
  console.log(results);
  process.exit(0);
}
check();
