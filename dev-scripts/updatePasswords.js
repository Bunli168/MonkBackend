const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run() {
  try {
    const users = await User.findAll();
    for (const user of users) {
      if (user.email === 'superadmin@pagoda.kh') {
        const hashedPassword = await bcrypt.hash('Admin@1234', 10);
        await user.update({ password: hashedPassword });
        console.log(`Updated password for ${user.email} to Admin@1234`);
      } else {
        const hashedPassword = await bcrypt.hash('Neakavorn@123', 10);
        await user.update({ password: hashedPassword });
        console.log(`Updated password for ${user.email} to Neakavorn@123`);
      }
    }
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
