const sequelize = require('./config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Create payments table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount_paid DECIMAL(10, 2) NOT NULL,
        paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Payments table ensured.');

    // Add seating_row_id to user_profiles if it doesn't exist
    try {
      await sequelize.query(`ALTER TABLE user_profiles ADD COLUMN seating_row_id INT NULL`);
      await sequelize.query(`ALTER TABLE user_profiles ADD CONSTRAINT fk_seating_row FOREIGN KEY (seating_row_id) REFERENCES seating_rows(id) ON DELETE SET NULL`);
      console.log('Added seating_row_id to user_profiles.');
    } catch (e) {
      if (e.message.includes('Duplicate column name')) {
        console.log('seating_row_id already exists.');
      } else {
        console.error('Error adding seating_row_id:', e.message);
      }
    }

    // Add seat_number to user_profiles if it doesn't exist
    try {
      await sequelize.query(`ALTER TABLE user_profiles ADD COLUMN seat_number VARCHAR(50) NULL`);
      console.log('Added seat_number to user_profiles.');
    } catch (e) {
      if (e.message.includes('Duplicate column name')) {
        console.log('seat_number already exists.');
      } else {
        console.error('Error adding seat_number:', e.message);
      }
    }

    // Update ENUM for status in attendances
    try {
      await sequelize.query(`ALTER TABLE attendances MODIFY COLUMN status ENUM('present', 'absent', 'permission') NOT NULL DEFAULT 'present'`);
      console.log('Updated attendances status ENUM.');
    } catch (e) {
      console.error('Error modifying attendances ENUM:', e.message);
    }

    // Explicitly check for user_id in attendances just in case it's missing (though it shouldn't be)
    try {
      await sequelize.query(`ALTER TABLE attendances ADD COLUMN user_id INT NOT NULL`);
      await sequelize.query(`ALTER TABLE attendances ADD CONSTRAINT fk_att_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
      console.log('Added user_id to attendances.');
    } catch (e) {
      if (e.message.includes('Duplicate column name')) {
        console.log('user_id already exists in attendances.');
      } else {
        console.error('Error adding user_id to attendances:', e.message);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

migrate();
