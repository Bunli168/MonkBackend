const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const sqlFile = './monk_system_full.sql';

(async () => {
    try {
        fs.writeFileSync(sqlFile, ''); // Clear file
        
        console.log('Creating temporary database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            port: process.env.DB_PORT || 3306
        });
        
        await connection.query('DROP DATABASE IF EXISTS monk_db_temp_dump;');
        await connection.query('CREATE DATABASE monk_db_temp_dump;');
        await connection.end();

        // Override DB_NAME for Sequelize
        process.env.DB_NAME = 'monk_db_temp_dump';

        // Now require models/index.js
        const models = require('./models/index');
        const sequelize = models.sequelize;

        // Override logging to capture SQL
        sequelize.options.logging = (msg) => {
            if (msg.includes('CREATE TABLE') || msg.includes('ALTER TABLE')) {
                let sql = msg.replace('Executing (default): ', '');
                fs.appendFileSync(sqlFile, sql + ';\n\n');
            }
        };

        console.log('Syncing models to generate SQL...');
        await sequelize.sync({ force: true });
        
        // Add basic seed data
        const seedData = `
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES 
(1, 'Superadmin', 'System Administrator', NOW(), NOW()),
(2, 'Admin', 'Admin (Mekudi)', NOW(), NOW()),
(3, 'Monk', 'Monk', NOW(), NOW()),
(4, 'Student', 'Student', NOW(), NOW()),
(5, 'AttendanceTaker', 'Attendance Taker', NOW(), NOW());

INSERT INTO users (id, email, password, role_id, created_by, status, created_at) VALUES 
(1, 'superadmin@pagoda.kh', '$2b$10$hashedpassword1', 1, NULL, 'active', NOW());
`;
        fs.appendFileSync(sqlFile, seedData);

        console.log('SQL file generated at ' + sqlFile);

        // Cleanup
        const cleanupConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            port: process.env.DB_PORT || 3306
        });
        await cleanupConn.query('DROP DATABASE IF EXISTS monk_db_temp_dump;');
        await cleanupConn.end();
        console.log('Done! Generated SQL successfully.');
        process.exit(0);

    } catch (e) {
        console.error('Error generating SQL:', e);
        process.exit(1);
    }
})();
