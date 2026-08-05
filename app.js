const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const http = require('http');
const config = require('./config/index.js');
const { initializeSocket } = require('./config/socket.js');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth.js');
const roleRoutes = require('./routes/roles.js');
const kutRoutes = require('./routes/kuts.js');
const userRoutes = require('./routes/users.js');

const monkSurveysRoutes = require('./routes/monkSurveys.js');
const provinceRoutes = require('./routes/provinces.js');
const locationRoutes = require('./routes/locations');
const districtRoutes = require('./routes/districts.js');
const communeRoutes = require('./routes/communes.js');
const villageRoutes = require('./routes/villages.js');
const attendanceRoutes = require('./routes/attendances.js');
const seatingRowRoutes = require('./routes/seatingRows.js');
const retreatEventRoutes = require('./routes/retreatEvents.js');
const universityRoutes = require('./routes/universities.js');
const ledgerRoutes = require('./routes/ledger.js');
const fineRoutes = require('./routes/fines.js');
const leaveRequestRoutes = require('./routes/leaveRequests.js');
const ceremonyEventRoutes = require('./routes/ceremonyEvents.js');

// Initialize Telegram Bots
require('./services/telegramBot.js');
require('./services/otpTelegramBot.js');

const app = express();
app.set('trust proxy', 1);
const httpServer = http.createServer(app);
const path = require('path');

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Strict rate limiting for Auth routes to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 requests per 15 minutes
  message: 'Too many authentication attempts, please try again after 15 minutes.'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

const xss = require('xss-clean');

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Data sanitization against XSS
app.use(xss());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Ensure the leave-request workflow status column supports the new approval stages
if (sequelize.getDialect() === 'mysql') {
  sequelize.query("ALTER TABLE leave_requests MODIFY COLUMN status ENUM('pending','pending_mekudi','pending_superadmin','approved','rejected') NOT NULL DEFAULT 'pending_mekudi'")
    .catch((err) => {
      console.warn('Leave request status migration skipped:', err.message);
    });
}

// API routes
app.use('/api/auth', authRoutes);
const statisticsRoutes = require('./routes/statistics.js');

app.use('/api/roles', roleRoutes);
app.use('/api/kuts', kutRoutes);
app.use('/api/users', userRoutes);

const studentSurveysRoutes = require('./routes/studentSurveys.js');
app.use('/api/monk-surveys', monkSurveysRoutes);
app.use('/api/student-surveys', studentSurveysRoutes);
app.use('/api/statistics', statisticsRoutes);

app.use('/api/provinces', provinceRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/communes', communeRoutes);
app.use('/api/villages', villageRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/seating-rows', seatingRowRoutes);
app.use('/api/retreat-events', retreatEventRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/ceremony-events', ceremonyEventRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// Start server
if (!process.env.VERCEL) {
  const PORT = config.port || 3000;
  httpServer.listen(PORT, () => {});
}

module.exports = app;
// nodemon restart trigger
// another trigger
// another trigger 2
// another trigger 3
// another trigger 4
// another trigger 5
// another trigger 6
// another trigger 7
// force restart
// force restart 2
// force restart 3
// force restart 4
// force restart 4
// force restart 5
