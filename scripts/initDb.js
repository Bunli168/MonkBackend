const bcrypt = require('bcryptjs');
const { create, findByEmail } = require('../models/User.js');

async function initializeDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await findByEmail('admin@pagoda.com');

    if (existingAdmin) {
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

    // Create test teacher (MEKUDI)
    const mekudiPassword = await bcrypt.hash('Mekudi123', 10);
    await create({
      name: 'MEKUDI Teacher',
      email: 'mekudi@pagoda.com',
      password: mekudiPassword,
      role: 'MEKUDI',
      is_verified: 1
    });

    // Create test monk (MONK)
    const monkPassword = await bcrypt.hash('Monk123', 10);
    await create({
      name: 'Test Monk',
      email: 'monk@pagoda.com',
      password: monkPassword,
      role: 'MONK',
      is_verified: 1
    });

    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
