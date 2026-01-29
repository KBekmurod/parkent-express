const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError, InvalidTokenError, TokenExpiredError } = require('../utils/errorTypes');
const { ROLES } = require('../config/constants');

/**
 * Middleware to verify JWT token from Authorization header
 * Extracts user information and attaches to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      
      req.user = {
        userId: decoded.userId || decoded.id,
        telegramId: decoded.telegramId,
        role: decoded.role,
        username: decoded.username
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new InvalidTokenError('Invalid token');
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory to check if user has one of the required roles
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error('requireRole: allowedRoles must be a non-empty array');
  }

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.user.role) {
        throw new UnauthorizedError('User role not found');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole([ROLES.ADMIN]);

/**
 * Middleware to check if user is vendor
 */
const requireVendor = requireRole([ROLES.VENDOR]);

/**
 * Middleware to check if user is courier
 */
const requireCourier = requireRole([ROLES.COURIER]);

/**
 * Middleware to check if user is customer
 */
const requireCustomer = requireRole([ROLES.CUSTOMER]);

/**
 * Middleware to check if user is vendor or admin
 */
const requireVendorOrAdmin = requireRole([ROLES.VENDOR, ROLES.ADMIN]);

/**
 * Middleware to check if user is courier or admin
 */
const requireCourierOrAdmin = requireRole([ROLES.COURIER, ROLES.ADMIN]);

/**
 * Optional authentication - doesn't fail if no token provided
 * Attaches user info if valid token exists
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      
      req.user = {
        userId: decoded.userId || decoded.id,
        telegramId: decoded.telegramId,
        role: decoded.role,
        username: decoded.username
      };
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireVendor,
  requireCourier,
  requireCustomer,
  requireVendorOrAdmin,
  requireCourierOrAdmin,
  optionalAuth
};
