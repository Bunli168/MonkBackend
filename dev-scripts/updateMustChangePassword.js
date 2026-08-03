const User = require('../models/User');

async function run() {
  try {
    const users = await User.findAll();
    for (const user of users) {
      await user.update({ must_change_password: true });
      console.log(`Updated must_change_password for ${user.email}`);
    }
    console.log('Done updating must_change_password!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
