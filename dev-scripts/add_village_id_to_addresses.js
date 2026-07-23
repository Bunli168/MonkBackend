const sequelize = require('../config/database');

async function addVillageIdToAddresses() {
  try {
    console.log('Adding village_id column to addresses table...');
    
    await sequelize.getQueryInterface().addColumn('addresses', 'village_id', {
      type: sequelize.Sequelize.INTEGER,
      allowNull: true,
      after: 'commune_id'
    });
    
    console.log('Successfully added village_id column to addresses table');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate column')) {
      console.log('Column village_id already exists in addresses table');
      process.exit(0);
    }
    console.error('Error adding village_id column:', error);
    process.exit(1);
  }
}

addVillageIdToAddresses();
