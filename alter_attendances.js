const sequelize = require('./config/database');
async function run() {
  try {
    await sequelize.query('ALTER TABLE attendances ADD COLUMN row_id INT NULL');
    await sequelize.query('ALTER TABLE attendances ADD COLUMN seating_row_id INT NULL');
    await sequelize.query('ALTER TABLE attendances ADD COLUMN seat_number VARCHAR(50) NULL');
    await sequelize.query('ALTER TABLE attendances ADD COLUMN fine_amount DECIMAL(10,2) DEFAULT 0.00');
    console.log('Columns added successfully');
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
