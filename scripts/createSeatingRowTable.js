const sequelize = require('../config/database');

const createSeatingRowTable = async () => {
  try {
    await sequelize.authenticate();

    // Create the seating_rows table using raw SQL
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS seating_rows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        row_num INT NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL,
        capacity INT NOT NULL DEFAULT 0,
        assigned_taker_id INT NULL,
        kut_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_taker_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (kut_id) REFERENCES kuts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    process.exit(0);
  } catch (error) {
    console.error('Error creating seating row table:', error);
    process.exit(1);
  }
};

createSeatingRowTable();
