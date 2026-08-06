const { verifyAccessToken } = require('../utils/jwt.js');
const User = require('../models/User.js');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    const user = await User.findByPk(decoded.userId, {
      include: [
        { model: require('../models').Role },
        { model: require('../models').UserProfile }
      ]
    });
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRole = req.user.Role ? req.user.Role.name : null;
    
    const uppercaseRoles = roles.map(r => r.replace(/\s+/g, '').toUpperCase());
    const uppercaseUserRole = userRole ? userRole.replace(/\s+/g, '').toUpperCase() : null;
    
    if (!uppercaseRoles.includes(uppercaseUserRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      if (decoded) {
        const user = await User.findByPk(decoded.userId, {
          include: [
            { model: require('../models').Role },
            { model: require('../models').UserProfile }
          ]
        });
        if (user && user.is_active) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
