const sequelize = require('./config/database');

async function addPlaceOfBirthColumn() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Adding place_of_birth column to user_profiles table...');
    await sequelize.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN place_of_birth VARCHAR(255)
    `);
    
    console.log('Column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error.message);
    
    // Check if column already exists
    if (error.message.includes('Duplicate column')) {
      console.log('Column place_of_birth already exists in the table.');
      process.exit(0);
    }
    
    process.exit(1);
  }
}

addPlaceOfBirthColumn();
