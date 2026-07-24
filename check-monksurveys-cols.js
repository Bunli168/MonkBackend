const { sequelize } = require('./models');

async function check() {
  const [res] = await sequelize.query("DESCRIBE monk_surveys");
  console.log(res);
}
check();
