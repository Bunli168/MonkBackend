const sequelize = require('./config/database');
async function run() {
  const [results] = await sequelize.query('DESCRIBE seating_rows');
  console.log(results);
  process.exit();
}
run();
