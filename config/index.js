const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'Neakavorn Pagoda';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'Neakavorn Pagoda';

if (nodeEnv === 'production') {
  if (jwtSecret === 'Neakavorn Pagoda' || jwtRefreshSecret === 'Neakavorn Pagoda') {
    throw new Error('CRITICAL SECURITY ERROR: Default JWT Secrets are being used in production. Please set JWT_SECRET and JWT_REFRESH_SECRET in your .env file.');
  }
}

module.exports = {
  port: process.env.PORT || 3006,
  nodeEnv: nodeEnv,
  corsOrigin: process.env.CORS_ORIGIN ? [...process.env.CORS_ORIGIN.split(','), 'https://neakavorn-pagoda.netlify.app'] : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://neakavorn-pagoda.netlify.app'],
  jwt: {
    secret: jwtSecret,
    refreshSecret: jwtRefreshSecret,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@pagoda.com'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000
  }
};
