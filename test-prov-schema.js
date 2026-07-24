const { sequelize } = require('./models');

async function test() {
  try {
     const [results] = await sequelize.query("SHOW CREATE TABLE provinces");
     console.log(results[0]['Create Table']);
  } catch (e) {
     console.error(e);
  }
  process.exit(0);
}
test();
