const User = require('../models/User');

async function run() {
  try {
    const user = await User.findOne({ where: { email: 'superadmin@pagoda.kh' } });
    if (user) {
      await user.update({ must_change_password: false });
      console.log('Successfully removed must_change_password requirement for superadmin@pagoda.kh');
    } else {
      console.log('Super admin not found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
