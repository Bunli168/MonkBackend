const sequelize = require('./config/database');
const { User } = require('./models');
async function run() {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'role'] });
    console.log(JSON.stringify(users, null, 2));
  } catch(e) {
    console.log(e);
  }
  process.exit();
}
run();
