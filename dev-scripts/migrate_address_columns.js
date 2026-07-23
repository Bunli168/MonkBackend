const { sequelize } = require('./models');

(async () => {
  try {
    console.log('Starting address columns migration...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Add new columns to addresses table
    console.log('Adding new columns to addresses table...');
    
    await sequelize.query(`
      ALTER TABLE addresses 
      ADD COLUMN province_id INT NULL AFTER address_type,
      ADD COLUMN district_id INT NULL AFTER province_id,
      ADD COLUMN commune_id INT NULL AFTER district_id
    `);
    console.log('New columns added successfully.');

    // Add foreign key constraints after data migration
    console.log('Adding foreign key constraints...');
    
    await sequelize.query(`
      ALTER TABLE addresses 
      ADD CONSTRAINT addresses_province_id_foreign 
      FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE RESTRICT
    `);
    
    await sequelize.query(`
      ALTER TABLE addresses 
      ADD CONSTRAINT addresses_district_id_foreign 
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
    `);
    
    await sequelize.query(`
      ALTER TABLE addresses 
      ADD CONSTRAINT addresses_commune_id_foreign 
      FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE SET NULL
    `);
    console.log('Foreign key constraints added successfully.');

    console.log('Address columns migration completed successfully!');
    process.exit(0);
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping column creation.');
      console.log('Migration completed successfully!');
      process.exit(0);
    } else {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
})();
