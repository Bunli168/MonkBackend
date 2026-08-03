const User = require('../models/User');

async function run() {
  try {
    // Set must_change_password to false for all users
    await User.update({ must_change_password: false }, { where: {} });
    console.log('Successfully removed must_change_password requirement for all users');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
