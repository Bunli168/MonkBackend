const { User } = require('./models');
const authService = require('./services/authService');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('Default@123', 10);
    // 1. Create or update a test user
    let user = await User.findOne({ where: { email: 'testflow@example.com' } });
    if (!user) {
      user = await User.create({
        email: 'testflow@example.com',
        password: hashedPassword,
        is_verified: true,
        role_id: 2, // something that doesn't require OTP
        must_change_password: true,
        is_active: true
      });
    } else {
      await user.update({ password: hashedPassword, must_change_password: true });
    }

    // 2. Login
    const loginRes = await authService.login('testflow@example.com', 'Default@123');
    console.log('Login Result:', loginRes);

    // 3. Extract token
    const token = loginRes.token;

    // 4. Change Password
    const changeRes = await authService.changePassword(token, 'NewPassword1!');
    console.log('Change Result:', changeRes);

  } catch (e) {
    console.error(e);
  }
  process.exit();
})();
