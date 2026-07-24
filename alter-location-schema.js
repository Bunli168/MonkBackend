const { sequelize } = require('./models');

async function alter() {
  try {
    console.log("Dropping foreign keys...");
    await sequelize.query('ALTER TABLE villages DROP FOREIGN KEY villages_ibfk_1;');
    await sequelize.query('ALTER TABLE communes DROP FOREIGN KEY communes_ibfk_1;');
    await sequelize.query('ALTER TABLE districts DROP FOREIGN KEY districts_ibfk_1;');

    console.log("Emptying tables to prepare for schema change...");
    await sequelize.query('TRUNCATE TABLE villages;');
    await sequelize.query('TRUNCATE TABLE communes;');
    await sequelize.query('TRUNCATE TABLE districts;');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.query('TRUNCATE TABLE provinces;');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log("Altering column types...");
    await sequelize.query('ALTER TABLE provinces MODIFY COLUMN id VARCHAR(100) NOT NULL;');
    await sequelize.query('ALTER TABLE districts MODIFY COLUMN id VARCHAR(100) NOT NULL;');
    await sequelize.query('ALTER TABLE districts MODIFY COLUMN province_id VARCHAR(100) NOT NULL;');
    await sequelize.query('ALTER TABLE communes MODIFY COLUMN id VARCHAR(100) NOT NULL;');
    await sequelize.query('ALTER TABLE communes MODIFY COLUMN district_id VARCHAR(100) NOT NULL;');
    await sequelize.query('ALTER TABLE villages MODIFY COLUMN id VARCHAR(100) NOT NULL;');
    await sequelize.query('ALTER TABLE villages MODIFY COLUMN commune_id VARCHAR(100) NOT NULL;');

    console.log("Re-adding foreign keys...");
    await sequelize.query('ALTER TABLE districts ADD CONSTRAINT districts_ibfk_1 FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE ON UPDATE CASCADE;');
    await sequelize.query('ALTER TABLE communes ADD CONSTRAINT communes_ibfk_1 FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE ON UPDATE CASCADE;');
    await sequelize.query('ALTER TABLE villages ADD CONSTRAINT villages_ibfk_1 FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE CASCADE ON UPDATE CASCADE;');

    console.log("Schema altered successfully!");
  } catch (err) {
    console.error("Error altering schema:", err);
  }
  process.exit(0);
}
alter();
