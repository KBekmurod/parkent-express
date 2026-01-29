const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const User = require('../../models/User');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('socket-auth');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return next(new Error('Invalid or expired token'));
      }
      
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = user;
      
      logger.info(`Socket authenticated: ${socket.id}, user: ${user._id}`);
      
      next();
      
    } catch (error) {
      return next(new Error('Invalid or expired token'));
    }
    
  } catch (error) {
    logger.error('Socket authentication error:', error);
    return next(new Error('Authentication failed'));
  }
};

module.exports = socketAuth;
