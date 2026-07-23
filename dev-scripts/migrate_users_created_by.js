const { sequelize } = require('./models');

(async () => {
  try {
    console.log('Starting users created_by column migration...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Add created_by column to users table
    console.log('Adding created_by column to users table...');
    
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN created_by INT NULL AFTER role_id
    `);
    console.log('created_by column added successfully.');

    // Add foreign key constraint
    console.log('Adding foreign key constraint...');
    
    await sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_created_by_foreign 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('Foreign key constraint added successfully.');

    console.log('Users created_by column migration completed successfully!');
    process.exit(0);
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists, skipping column creation.');
      console.log('Migration completed successfully!');
      process.exit(0);
    } else {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
})();
