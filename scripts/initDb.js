require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, Role, UserProfile } = require('../models');

async function initializeDatabase() {
  try {
    console.log('Initializing database with default roles and users...');

    // 1. Create Roles
    const rolesData = [
      { id: 1, name: 'super_admin', description: 'System Administrator' },
      { id: 2, name: 'admin', description: 'Administrator' },
      { id: 3, name: 'mekudi', description: 'Mekudi Teacher' },
      { id: 4, name: 'monk', description: 'Monk' }
    ];

    for (const roleData of rolesData) {
      await Role.findOrCreate({
        where: { id: roleData.id },
        defaults: roleData
      });
    }

    // 2. Create Super Admin User
    const existingAdmin = await User.findOne({ where: { email: 'admin@pagoda.com' } });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('Admin123', 10);
      const adminUser = await User.create({
        email: 'admin@pagoda.com',
        password: adminPassword,
        role_id: 1, // super_admin
        is_verified: true,
        status: 'active'
      });

      await UserProfile.create({
        user_id: adminUser.id,
        first_name: 'Super',
        last_name: 'Admin',
        first_name_kh: 'អ្នកគ្រប់គ្រង',
        last_name_kh: 'កំពូល'
      });
      console.log('Admin user created successfully (admin@pagoda.com / Admin123)');
    } else {
      console.log('Admin user already exists');
    }

    // 3. Create Mekudi User
    const existingMekudi = await User.findOne({ where: { email: 'mekudi@pagoda.com' } });
    if (!existingMekudi) {
      const mekudiPassword = await bcrypt.hash('Mekudi123', 10);
      const mekudiUser = await User.create({
        email: 'mekudi@pagoda.com',
        password: mekudiPassword,
        role_id: 3, // mekudi
        is_verified: true,
        status: 'active'
      });
      await UserProfile.create({
        user_id: mekudiUser.id,
        first_name: 'Mekudi',
        last_name: 'Teacher',
        first_name_kh: 'មេកុដិ',
        last_name_kh: 'គ្រូ'
      });
      console.log('Mekudi user created successfully (mekudi@pagoda.com / Mekudi123)');
    }

    // 4. Create Monk User
    const existingMonk = await User.findOne({ where: { email: 'monk@pagoda.com' } });
    if (!existingMonk) {
      const monkPassword = await bcrypt.hash('Monk123', 10);
      const monkUser = await User.create({
        email: 'monk@pagoda.com',
        password: monkPassword,
        role_id: 4, // monk
        is_verified: true,
        status: 'active'
      });
      await UserProfile.create({
        user_id: monkUser.id,
        first_name: 'Test',
        last_name: 'Monk',
        first_name_kh: 'តេស្ត',
        last_name_kh: 'ភិក្ខុ'
      });
      console.log('Monk user created successfully (monk@pagoda.com / Monk123)');
    }

    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
