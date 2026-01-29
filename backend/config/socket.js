const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { SOCKET_EVENTS } = require('./constants');

class SocketConfig {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.courierLocations = new Map();
  }

  initialize(server) {
    const corsOptions = {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    };

    this.io = new Server(server, {
      cors: corsOptions,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6,
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    this.setupEventHandlers();
    this.setupMiddleware();

    logger.info('Socket.io initialized successfully');

    return this.io;
  }

  setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      const role = socket.handshake.auth.role;

      if (!userId) {
        logger.warn('Socket connection rejected: Missing userId');
        return next(new Error('Authentication required'));
      }

      socket.userId = userId;
      socket.role = role || 'customer';
      socket.token = token;

      logger.debug('Socket authenticated', {
        socketId: socket.id,
        userId,
        role: socket.role
      });

      next();
    });
  }

  setupEventHandlers() {
    this.io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
      logger.info('New socket connection', {
        socketId: socket.id,
        userId: socket.userId,
        role: socket.role
      });

      this.handleConnection(socket);
      this.handleDisconnection(socket);
      this.handleLocationUpdates(socket);
      this.handleOrderEvents(socket);
      this.handleCourierEvents(socket);
      this.handleErrors(socket);
    });
  }

  handleConnection(socket) {
    this.connectedUsers.set(socket.userId, {
      socketId: socket.id,
      role: socket.role,
      connectedAt: new Date(),
      socket: socket
    });

    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.role}`);

    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.role,
      timestamp: new Date()
    });

    logger.info(`User joined rooms`, {
      userId: socket.userId,
      rooms: Array.from(socket.rooms)
    });
  }

  handleDisconnection(socket) {
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason
      });

      this.connectedUsers.delete(socket.userId);
      this.courierLocations.delete(socket.userId);

      if (socket.role === 'courier') {
        this.io.to('role:vendor').emit(SOCKET_EVENTS.COURIER_OFFLINE, {
          courierId: socket.userId,
          timestamp: new Date()
        });
      }
    });
  }

  handleLocationUpdates(socket) {
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, (data) => {
      try {
        const { latitude, longitude, orderId } = data;

        if (!latitude || !longitude) {
          throw new Error('Invalid location data');
        }

        const locationData = {
          userId: socket.userId,
          latitude,
          longitude,
          orderId,
          timestamp: new Date()
        };

        this.courierLocations.set(socket.userId, locationData);

        if (orderId) {
          this.io.to(`order:${orderId}`).emit(SOCKET_EVENTS.LOCATION_UPDATE, locationData);
        }

        logger.debug('Location updated', {
          userId: socket.userId,
          orderId,
          latitude,
          longitude
        });
      } catch (error) {
        logger.error('Error handling location update:', {
          error: error.message,
          userId: socket.userId
        });

        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to update location',
          error: error.message
        });
      }
    });
  }

  handleOrderEvents(socket) {
    socket.on('order:join', (orderId) => {
      socket.join(`order:${orderId}`);
      
      logger.debug('User joined order room', {
        userId: socket.userId,
        orderId
      });
    });

    socket.on('order:leave', (orderId) => {
      socket.leave(`order:${orderId}`);
      
      logger.debug('User left order room', {
        userId: socket.userId,
        orderId
      });
    });
  }

  handleCourierEvents(socket) {
    if (socket.role === 'courier') {
      socket.on(SOCKET_EVENTS.COURIER_ONLINE, () => {
        this.io.to('role:vendor').emit(SOCKET_EVENTS.COURIER_ONLINE, {
          courierId: socket.userId,
          timestamp: new Date()
        });

        logger.info('Courier went online', {
          courierId: socket.userId
        });
      });
    }
  }

  handleErrors(socket) {
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    });
  }

  emitToUser(userId, event, data) {
    try {
      this.io.to(`user:${userId}`).emit(event, data);
      
      logger.debug('Event emitted to user', {
        userId,
        event
      });

      return true;
    } catch (error) {
      logger.error('Failed to emit to user:', {
        userId,
        event,
        error: error.message
      });
      return false;
    }
  }

  emitToRole(role, event, data) {
    try {
      this.io.to(`role:${role}`).emit(event, data);
      
      logger.debug('Event emitted to role', {
        role,
        event
      });

      return true;
    } catch (error) {
      logger.error('Failed to emit to role:', {
        role,
        event,
        error: error.message
      });
      return false;
    }
  }

  emitToOrder(orderId, event, data) {
    try {
      this.io.to(`order:${orderId}`).emit(event, data);
      
      logger.debug('Event emitted to order', {
        orderId,
        event
      });

      return true;
    } catch (error) {
      logger.error('Failed to emit to order:', {
        orderId,
        event,
        error: error.message
      });
      return false;
    }
  }

  broadcast(event, data) {
    try {
      this.io.emit(event, data);
      
      logger.debug('Event broadcasted', {
        event
      });

      return true;
    } catch (error) {
      logger.error('Failed to broadcast:', {
        event,
        error: error.message
      });
      return false;
    }
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  getConnectedUser(userId) {
    return this.connectedUsers.get(userId);
  }

  getCourierLocation(courierId) {
    return this.courierLocations.get(courierId);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  getConnectedUsersByRole(role) {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.role === role)
      .map(user => user.userId);
  }

  disconnectUser(userId) {
    const user = this.connectedUsers.get(userId);
    
    if (user && user.socket) {
      user.socket.disconnect(true);
      this.connectedUsers.delete(userId);
      
      logger.info('User disconnected manually', {
        userId
      });

      return true;
    }

    return false;
  }

  getConnectionCount() {
    return this.connectedUsers.size;
  }

  getStats() {
    const roles = {};
    
    for (const user of this.connectedUsers.values()) {
      roles[user.role] = (roles[user.role] || 0) + 1;
    }

    return {
      total: this.connectedUsers.size,
      roles,
      courierLocations: this.courierLocations.size,
      timestamp: new Date()
    };
  }

  getIO() {
    if (!this.io) {
      throw new Error('Socket.io is not initialized. Call initialize() first.');
    }
    return this.io;
  }

  isInitialized() {
    return this.io !== null;
  }
}

const socketConfig = new SocketConfig();

module.exports = socketConfig;
