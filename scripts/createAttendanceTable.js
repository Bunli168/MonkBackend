const sequelize = require('../config/database');

const createAttendanceTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Create the attendances table using raw SQL
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS attendances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        kut_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent') NOT NULL DEFAULT 'present',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (user_id, date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kut_id) REFERENCES kuts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('Attendance table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating attendance table:', error);
    process.exit(1);
  }
};

createAttendanceTable();
