const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const config = require('./config/index.js');
const { initializeSocket } = require('./config/socket.js');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth.js');
const roleRoutes = require('./routes/roles.js');
const kutRoutes = require('./routes/kuts.js');
const userRoutes = require('./routes/users.js');
const messageRoutes = require('./routes/messages.js');
const reportRoutes = require('./routes/reports.js');
const reportCategoryRoutes = require('./routes/reportCategories.js');
const publicContentRoutes = require('./routes/publicContents.js');

const provinceRoutes = require('./routes/provinces.js');
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

// Initialize Telegram Bot
require('./services/telegramBot.js');

const app = express();
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
  origin: function(origin, callback) {
    // Allow any localhost port in development
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, config.corsOrigin);
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const xss = require('xss-clean');

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Data sanitization against XSS
app.use(xss());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Ensure the leave-request workflow status column supports the new approval stages
sequelize.query("ALTER TABLE leave_requests MODIFY COLUMN status ENUM('pending','pending_mekudi','pending_superadmin','approved','rejected') NOT NULL DEFAULT 'pending_mekudi'")
  .catch((err) => {
    console.warn('Leave request status migration skipped:', err.message);
  });

// API routes
app.use('/api/auth', authRoutes);
const statisticsRoutes = require('./routes/statistics.js');

app.use('/api/roles', roleRoutes);
app.use('/api/kuts', kutRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/report-categories', reportCategoryRoutes);
app.use('/api/public-contents', publicContentRoutes);
app.use('/api/statistics', statisticsRoutes);

app.use('/api/provinces', provinceRoutes);
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
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`CORS origin: ${config.corsOrigin}`);
});

module.exports = { io };
// nodemon restart trigger
// another trigger
// another trigger 2
// another trigger 3
// another trigger 4
// another trigger 5
// another trigger 6
// another trigger 7
