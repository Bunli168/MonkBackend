const sequelize = require('./config/database');

async function addAddressStringFields() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Adding string fields to addresses table...');
    
    // Make province_id nullable if it's not already
    try {
      await sequelize.query(`
        ALTER TABLE addresses 
        MODIFY COLUMN province_id INT NULL
      `);
      console.log('Made province_id nullable');
    } catch (error) {
      if (!error.message.includes('Duplicate')) {
        console.log('Note:', error.message);
      }
    }

    // Add province string field
    try {
      await sequelize.query(`
        ALTER TABLE addresses 
        ADD COLUMN province VARCHAR(255)
      `);
      console.log('Added province column');
    } catch (error) {
      if (!error.message.includes('Duplicate column')) {
        console.log('Note:', error.message);
      }
    }

    // Add district string field
    try {
      await sequelize.query(`
        ALTER TABLE addresses 
        ADD COLUMN district VARCHAR(255)
      `);
      console.log('Added district column');
    } catch (error) {
      if (!error.message.includes('Duplicate column')) {
        console.log('Note:', error.message);
      }
    }

    // Add commune string field
    try {
      await sequelize.query(`
        ALTER TABLE addresses 
        ADD COLUMN commune VARCHAR(255)
      `);
      console.log('Added commune column');
    } catch (error) {
      if (!error.message.includes('Duplicate column')) {
        console.log('Note:', error.message);
      }
    }

    console.log('All string fields added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error.message);
    process.exit(1);
  }
}

addAddressStringFields();
