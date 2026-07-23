const sequelize = require('./config/database');
async function update() {
  try {
    await sequelize.query('ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT false;');
    await sequelize.query('ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255) DEFAULT NULL;');
    console.log("Columns added successfully");
  } catch(e) {
    console.error("Error adding columns:", e);
  }
  process.exit(0);
}
update();
