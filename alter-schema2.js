const { sequelize } = require('./models');

async function alter() {
  try {
    console.log("Dropping foreign keys on addresses...");
    await sequelize.query('ALTER TABLE addresses DROP FOREIGN KEY addresses_ibfk_34;');
    await sequelize.query('ALTER TABLE addresses DROP FOREIGN KEY addresses_ibfk_35;');
    await sequelize.query('ALTER TABLE addresses DROP FOREIGN KEY addresses_ibfk_36;');

    console.log("Altering addresses table...");
    await sequelize.query('ALTER TABLE addresses MODIFY COLUMN province_id VARCHAR(100);');
    await sequelize.query('ALTER TABLE addresses MODIFY COLUMN district_id VARCHAR(100);');
    await sequelize.query('ALTER TABLE addresses MODIFY COLUMN commune_id VARCHAR(100);');
    await sequelize.query('ALTER TABLE addresses MODIFY COLUMN village_id VARCHAR(100);');
    
    console.log("Altering monk_surveys table...");
    const [results] = await sequelize.query("SHOW COLUMNS FROM monk_surveys LIKE 'pob_province'");
    if (results.length > 0) {
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN pob_province TO pob_province_id;');
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN pob_district TO pob_district_id;');
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN pob_commune TO pob_commune_id;');
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN pob_village TO pob_village_id;');
       
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN ordination_province TO ordination_province_id;');
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN ordination_district TO ordination_district_id;');
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN ordination_commune TO ordination_commune_id;');
       
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN current_province TO current_province_id;');
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN current_district TO current_district_id;');
       await sequelize.query('ALTER TABLE monk_surveys RENAME COLUMN current_commune TO current_commune_id;');
    } else {
       console.log("Columns already renamed.");
    }
    console.log("Schema altered successfully!");
  } catch (err) {
    console.error("Error altering schema:", err);
  }
  process.exit(0);
}
alter();
