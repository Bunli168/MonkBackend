require('pg'); // Keep for good measure
const pg = require('pg');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres.vbxotzbkerxpgvfaxjyq',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: process.env.DB_PORT || 6543,
    dialect: process.env.DB_DIALECT || 'postgres',
    dialectModule: pg,
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

testConnection();

module.exports = sequelize;