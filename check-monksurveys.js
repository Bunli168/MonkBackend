const { sequelize } = require('./models');

async function check() {
  const [res] = await sequelize.query("SHOW CREATE TABLE monk_surveys");
  console.log(res[0]['Create Table']);
}
check();
