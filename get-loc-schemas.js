const { sequelize } = require('./models');

async function check() {
  try {
     let [res] = await sequelize.query("SHOW CREATE TABLE provinces");
     console.log(res[0]['Create Table']);
     
     [res] = await sequelize.query("SHOW CREATE TABLE districts");
     console.log(res[0]['Create Table']);
     
     [res] = await sequelize.query("SHOW CREATE TABLE communes");
     console.log(res[0]['Create Table']);
     
     [res] = await sequelize.query("SHOW CREATE TABLE villages");
     console.log(res[0]['Create Table']);
  } catch (e) {
     console.error(e);
  }
  process.exit(0);
}
check();
