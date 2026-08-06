require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

async function seedLocations() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    const sqlFilePath = path.join(__dirname, '..', 'monk_locations_seed.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Error: Could not find ${sqlFilePath}`);
      process.exit(1);
    }

    console.log('Reading SQL file...');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');

    // Split the file into separate statements
    const statements = sqlCommands
      .split(';\n')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements. Executing...`);
    console.log('This may take a minute or two because there are over 16,000 locations. Please wait...');

    for (let i = 0; i < statements.length; i++) {
      await sequelize.query(statements[i]);
      if ((i + 1) % 2000 === 0) {
        console.log(`Executed ${i + 1} of ${statements.length} statements...`);
      }
    }

    console.log('Successfully seeded all locations!');
  } catch (error) {
    console.error('Error seeding locations:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedLocations();
