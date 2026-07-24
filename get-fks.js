const { sequelize } = require('./models');

async function test() {
  try {
     const [results] = await sequelize.query("SHOW CREATE TABLE addresses");
     console.log(results[0]['Create Table']);
  } catch (e) {
     console.error(e);
  }
  process.exit(0);
}
test();
