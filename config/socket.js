const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt.js');
const { findById } = require('../models/User.js');

let io;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyAccessToken(token);
      
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      const user = await findById(decoded.userId);
      
      if (!user || !user.is_active) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    // Join user-specific room
    socket.join(`user_${socket.user.id}`);

    // Join admin room if user is admin-like or mekudi
    const roleName = (socket.user.role || '').toUpperCase();
    if (['ADMIN', 'LEADER', 'MEKUDI'].includes(roleName)) {
      socket.join('admin');
    } else if (roleName === 'SUPERADMIN') {
      socket.join('superadmin');
    }

    // Handle custom events
    socket.on('join_user', (userId) => {
      const roleName = (socket.user.role || '').toUpperCase();
      if (socket.user.id === userId || ['ADMIN', 'LEADER', 'MEKUDI', 'SUPERADMIN'].includes(roleName)) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on('join_admin', () => {
      const roleName = (socket.user.role || '').toUpperCase();
      if (['ADMIN', 'LEADER', 'MEKUDI'].includes(roleName)) {
        socket.join('admin');
      } else if (roleName === 'SUPERADMIN') {
        socket.join('superadmin');
      }
    });

    socket.on('leave_user', (userId) => {
      socket.leave(`user_${userId}`);
    });

    socket.on('leave_admin', () => {
      socket.leave('admin');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper functions to emit events
const emitToUser = (userId, event, data) => {
  const io = getIo();
  io.to(`user_${userId}`).emit(event, data);
};

const emitToAdmins = (event, data) => {
  const io = getIo();
  io.to('admin').emit(event, data);
};

const emitToSuperAdmins = (event, data) => {
  const io = getIo();
  io.to('superadmin').emit(event, data);
};

const emitToAll = (event, data) => {
  const io = getIo();
  io.emit(event, data);
};

module.exports = {
  initializeSocket,
  getIo,
  emitToUser,
  emitToAdmins,
  emitToSuperAdmins,
  emitToAll
};
