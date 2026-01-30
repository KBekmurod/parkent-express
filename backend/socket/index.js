const socketAuth = require('./middleware/auth');
const registerOrderHandlers = require('./handlers/orderHandler');
const registerCourierHandlers = require('./handlers/courierHandler');
const registerAdminHandlers = require('./handlers/adminHandler');
const { createLogger } = require('../utils/logger');
const EVENTS = require('./events');

const logger = createLogger('socket');

const initSocketHandlers = (io) => {
  io.use(socketAuth);
  
  io.on(EVENTS.CONNECTION, (socket) => {
    logger.info(`Client connected: ${socket.id}, user: ${socket.userId}, role: ${socket.userRole}`);
    
    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.userRole}`);
    socket.join('all-users');
    
    if (socket.userRole === 'admin') {
      socket.join('admin');
    }
    
    if (socket.userRole === 'vendor') {
      socket.join('vendors');
    }
    
    registerOrderHandlers(io, socket);
    registerCourierHandlers(io, socket);
    registerAdminHandlers(io, socket);
    
    socket.on(EVENTS.DISCONNECT, (reason) => {
      logger.info(`Client disconnected: ${socket.id}, user: ${socket.userId}, reason: ${reason}`);
    });
    
    socket.on(EVENTS.ERROR, (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
    
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });
  
  logger.info('Socket.io handlers initialized');
};

module.exports = {
  initSocketHandlers
};
