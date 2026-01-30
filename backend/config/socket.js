const { Server } = require('socket.io');
const { createLogger } = require('../utils/logger');

const logger = createLogger('socket');

const corsOrigin = process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000';
const pingTimeout = parseInt(process.env.SOCKET_PING_TIMEOUT, 10) || 60000;
const pingInterval = parseInt(process.env.SOCKET_PING_INTERVAL, 10) || 25000;

const socketOptions = {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout,
  pingInterval,
  transports: ['websocket', 'polling'],
  allowEIO3: true
};

let io = null;
let isInitialized = false;

const initSocket = (server) => {
  if (isInitialized && io) {
    logger.info('Socket.io already initialized');
    return io;
  }

  try {
    io = new Server(server, socketOptions);
    
    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });
      
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
    
    isInitialized = true;
    logger.info('Socket.io initialized successfully');
    
    return io;
    
  } catch (error) {
    logger.error('Error initializing Socket.io:', error);
    isInitialized = false;
    throw error;
  }
};

const getIO = () => {
  if (!io || !isInitialized) {
    throw new Error('Socket.io is not initialized. Call initSocket() first.');
  }
  return io;
};

const closeSocket = async () => {
  if (!io) {
    return;
  }
  
  try {
    const sockets = await io.fetchSockets();
    sockets.forEach(socket => {
      socket.disconnect(true);
    });
    
    io.close();
    isInitialized = false;
    io = null;
    
    logger.info('Socket.io closed');
    
  } catch (error) {
    logger.error('Error closing Socket.io:', error);
    throw error;
  }
};

const getSocketStatus = () => {
  if (!io) {
    return {
      isInitialized: false,
      connectedClients: 0
    };
  }
  
  return {
    isInitialized,
    connectedClients: io.engine.clientsCount || 0
  };
};

const emitToRoom = (room, event, data) => {
  if (!io) {
    logger.warn('Cannot emit event: Socket.io not initialized');
    return;
  }
  
  io.to(room).emit(event, data);
};

const emitToUser = (userId, event, data) => {
  if (!io) {
    logger.warn('Cannot emit event: Socket.io not initialized');
    return;
  }
  
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = {
  initSocket,
  getIO,
  closeSocket,
  getSocketStatus,
  emitToRoom,
  emitToUser,
  socketOptions
};
