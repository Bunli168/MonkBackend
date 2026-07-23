const bcrypt = require('bcryptjs');
const { create, findByEmail } = require('../models/User.js');

async function initializeDatabase() {
  try {
    console.log('Initializing database with default users...');

    // Check if admin user already exists
    const existingAdmin = await findByEmail('admin@pagoda.com');

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123', 10);
    await create({
      name: 'System Admin',
      email: 'admin@pagoda.com',
      password: adminPassword,
      role: 'ADMIN',
      is_verified: 1
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@pagoda.com');
    console.log('Password: Admin123');
    console.log('Please change the password after first login');

    // Create test teacher (MEKUDI)
    const mekudiPassword = await bcrypt.hash('Mekudi123', 10);
    await create({
      name: 'MEKUDI Teacher',
      email: 'mekudi@pagoda.com',
      password: mekudiPassword,
      role: 'MEKUDI',
      is_verified: 1
    });

    console.log('Test teacher created successfully');
    console.log('Email: mekudi@pagoda.com');
    console.log('Password: Mekudi123');

    // Create test monk (MONK)
    const monkPassword = await bcrypt.hash('Monk123', 10);
    await create({
      name: 'Test Monk',
      email: 'monk@pagoda.com',
      password: monkPassword,
      role: 'MONK',
      is_verified: 1
    });

    console.log('Test monk created successfully');
    console.log('Email: monk@pagoda.com');
    console.log('Password: Monk123');

    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
