const { Role } = require('./models');
async function run() {
  const roles = await Role.findAll({ raw: true });
  console.log(roles);
  process.exit();
}
run();
