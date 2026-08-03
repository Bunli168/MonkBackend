require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, UserProfile } = require('../models');

async function addSuperAdmin() {
  try {
    const email = 'superadmin@pagoda.kh';
    const plainPassword = 'Admin@1234';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let user = await User.findOne({ where: { email } });
    if (user) {
      user.password = hashedPassword;
      user.role_id = 1; // Super Admin
      await user.save();
      console.log('Super admin updated.');
    } else {
      user = await User.create({
        email,
        password: hashedPassword,
        role_id: 1,
        is_verified: true,
        status: 'active'
      });
      await UserProfile.create({
        user_id: user.id,
        first_name: 'Super',
        last_name: 'Admin',
        first_name_kh: 'អ្នកគ្រប់គ្រង',
        last_name_kh: 'កំពូល'
      });
      console.log('Super admin created successfully!');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addSuperAdmin();
