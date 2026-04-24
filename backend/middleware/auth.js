const jwt = require('jsonwebtoken');
const db = require('../database/connection');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await db.get(`
      SELECT u.*, 
             GROUP_CONCAT(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Parse roles
    user.roles = user.roles ? user.roles.split(',') : [];
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access control middleware
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = Array.isArray(requiredRoles) 
      ? requiredRoles.some(role => userRoles.includes(role))
      : userRoles.includes(requiredRoles);

    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: userRoles
      });
    }

    next();
  };
};

// Check if user has specific role
const hasRole = (user, role) => {
  return user.roles && user.roles.includes(role);
};

// Check if user is staff or above
const isStaffOrAbove = (user) => {
  return hasRole(user, 'staff') || hasRole(user, 'responder') || hasRole(user, 'admin');
};

// Check if user is responder or above
const isResponderOrAbove = (user) => {
  return hasRole(user, 'responder') || hasRole(user, 'admin');
};

// Check if user is admin
const isAdmin = (user) => {
  return hasRole(user, 'admin');
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  hasRole,
  isStaffOrAbove,
  isResponderOrAbove,
  isAdmin,
  generateToken
};
