const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { SOCKET_EVENTS } = require('../config/constants');
const rooms = require('./rooms');
const orderUpdatesHandler = require('./handlers/orderUpdates');
const courierLocationHandler = require('./handlers/courierLocation');
const notificationsHandler = require('./handlers/notifications');

class SocketServer {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  /**
   * Initialize Socket.io server with CORS configuration
   * @param {Object} server - HTTP server instance
   * @returns {Object} Socket.io server instance
   */
  initialize(server) {
    try {
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

      this.setupMiddleware();
      this.setupEventHandlers();

      logger.info('Socket.io server initialized successfully', {
        cors: corsOptions.origin,
        transports: ['websocket', 'polling']
      });

      return this.io;
    } catch (error) {
      logger.error('Failed to initialize Socket.io server', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        const userId = socket.handshake.auth.userId;
        const role = socket.handshake.auth.role;

        if (!token && !userId) {
          logger.warn('Socket connection rejected: Missing credentials', {
            socketId: socket.id,
            handshake: socket.handshake.address
          });
          return next(new Error('Authentication required'));
        }

        // If token provided, verify it
        if (token) {
          try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
              throw new Error('JWT_SECRET not configured');
            }

            const decoded = jwt.verify(token, jwtSecret);
            socket.userId = decoded.userId || decoded.id;
            socket.role = decoded.role || 'customer';
            socket.username = decoded.username;
            socket.telegramId = decoded.telegramId;
            socket.token = token;

            logger.debug('Socket authenticated with JWT', {
              socketId: socket.id,
              userId: socket.userId,
              role: socket.role
            });
          } catch (jwtError) {
            logger.error('JWT verification failed', {
              error: jwtError.message,
              socketId: socket.id
            });
            return next(new Error('Invalid token'));
          }
        } else {
          // Use provided userId and role
          socket.userId = userId;
          socket.role = role || 'customer';

          logger.debug('Socket authenticated with credentials', {
            socketId: socket.id,
            userId: socket.userId,
            role: socket.role
          });
        }

        next();
      } catch (error) {
        logger.error('Socket authentication error', {
          error: error.message,
          stack: error.stack
        });
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  setupEventHandlers() {
    this.io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
      logger.info('New socket connection established', {
        socketId: socket.id,
        userId: socket.userId,
        role: socket.role,
        address: socket.handshake.address
      });

      this.handleConnection(socket);
      this.handleRoomManagement(socket);
      this.handleLocationUpdates(socket);
      this.handleDisconnection(socket);
      this.handleErrors(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    try {
      // Store connected user info
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        role: socket.role,
        username: socket.username,
        connectedAt: new Date(),
        socket: socket
      });

      // Join user-specific room
      socket.join(`user:${socket.userId}`);
      
      // Join role-based room
      socket.join(`role:${socket.role}`);

      // If admin, join admin room
      if (socket.role === 'admin' || socket.role === 'vendor') {
        rooms.joinAdminRoom(socket);
      }

      // If courier, join tracking room
      if (socket.role === 'courier') {
        rooms.joinCourierTrackingRoom(socket);
        
        // Notify vendors that courier is online
        this.io.to('role:vendor').emit(SOCKET_EVENTS.COURIER_ONLINE, {
          courierId: socket.userId,
          timestamp: new Date()
        });
      }

      // Send connection confirmation
      socket.emit('connected', {
        socketId: socket.id,
        userId: socket.userId,
        role: socket.role,
        rooms: Array.from(socket.rooms),
        timestamp: new Date()
      });

      logger.info('User connected and joined rooms', {
        userId: socket.userId,
        role: socket.role,
        rooms: Array.from(socket.rooms)
      });
    } catch (error) {
      logger.error('Error handling connection', {
        error: error.message,
        userId: socket.userId,
        socketId: socket.id
      });
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Connection setup failed',
        error: error.message
      });
    }
  }

  /**
   * Handle room management events
   */
  handleRoomManagement(socket) {
    // Join order room
    socket.on('order:join', (orderId) => {
      try {
        if (!orderId) {
          throw new Error('Order ID is required');
        }

        rooms.joinOrderRoom(socket, orderId);
        
        socket.emit('order:joined', {
          orderId,
          timestamp: new Date()
        });

        logger.debug('User joined order room', {
          userId: socket.userId,
          orderId
        });
      } catch (error) {
        logger.error('Error joining order room', {
          error: error.message,
          userId: socket.userId,
          orderId
        });
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to join order room',
          error: error.message
        });
      }
    });

    // Leave order room
    socket.on('order:leave', (orderId) => {
      try {
        if (!orderId) {
          throw new Error('Order ID is required');
        }

        rooms.leaveOrderRoom(socket, orderId);
        
        socket.emit('order:left', {
          orderId,
          timestamp: new Date()
        });

        logger.debug('User left order room', {
          userId: socket.userId,
          orderId
        });
      } catch (error) {
        logger.error('Error leaving order room', {
          error: error.message,
          userId: socket.userId,
          orderId
        });
      }
    });

    // Get room members (admin only)
    socket.on('room:members', async (roomName) => {
      try {
        if (socket.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }

        const members = await rooms.getRoomMembers(this.io, roomName);
        
        socket.emit('room:members:response', {
          roomName,
          members,
          count: members.length,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error getting room members', {
          error: error.message,
          userId: socket.userId,
          roomName
        });
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to get room members',
          error: error.message
        });
      }
    });
  }

  /**
   * Handle location update events
   */
  handleLocationUpdates(socket) {
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, (data) => {
      try {
        const { latitude, longitude, orderId, accuracy, speed, heading } = data;

        if (!latitude || !longitude) {
          throw new Error('Invalid location data: latitude and longitude required');
        }

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          throw new Error('Invalid location data: coordinates must be numbers');
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          throw new Error('Invalid location data: coordinates out of range');
        }

        const locationData = {
          userId: socket.userId,
          courierId: socket.userId,
          latitude,
          longitude,
          orderId,
          accuracy: accuracy || null,
          speed: speed || null,
          heading: heading || null,
          timestamp: new Date()
        };

        // Emit location update to order room if orderId provided
        if (orderId) {
          courierLocationHandler.emitCourierLocationUpdate(this.io, socket.userId, locationData);
        }

        // Acknowledge location update
        socket.emit('location:updated', {
          success: true,
          timestamp: new Date()
        });

        logger.debug('Location updated', {
          userId: socket.userId,
          orderId,
          latitude,
          longitude
        });
      } catch (error) {
        logger.error('Error handling location update', {
          error: error.message,
          userId: socket.userId,
          data
        });
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to update location',
          error: error.message
        });
      }
    });

    // Courier availability status
    socket.on('courier:availability', (data) => {
      try {
        if (socket.role !== 'courier') {
          throw new Error('Unauthorized: Courier access required');
        }

        const { isAvailable } = data;

        if (typeof isAvailable !== 'boolean') {
          throw new Error('Invalid availability status');
        }

        courierLocationHandler.emitCourierAvailabilityChange(this.io, socket.userId, isAvailable);

        socket.emit('courier:availability:updated', {
          success: true,
          isAvailable,
          timestamp: new Date()
        });

        logger.info('Courier availability changed', {
          courierId: socket.userId,
          isAvailable
        });
      } catch (error) {
        logger.error('Error updating courier availability', {
          error: error.message,
          userId: socket.userId
        });
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to update availability',
          error: error.message
        });
      }
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket) {
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      try {
        logger.info('Socket disconnected', {
          socketId: socket.id,
          userId: socket.userId,
          role: socket.role,
          reason
        });

        // Remove from connected users
        this.connectedUsers.delete(socket.userId);

        // If courier went offline, notify vendors
        if (socket.role === 'courier') {
          this.io.to('role:vendor').emit(SOCKET_EVENTS.COURIER_OFFLINE, {
            courierId: socket.userId,
            timestamp: new Date()
          });

          courierLocationHandler.emitCourierAvailabilityChange(this.io, socket.userId, false);
        }
      } catch (error) {
        logger.error('Error handling disconnection', {
          error: error.message,
          userId: socket.userId
        });
      }
    });
  }

  /**
   * Handle socket errors
   */
  handleErrors(socket) {
    socket.on('error', (error) => {
      logger.error('Socket error occurred', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
        stack: error.stack
      });
    });
  }

  /**
   * Get Socket.io instance
   */
  getIO() {
    if (!this.io) {
      throw new Error('Socket.io not initialized. Call initialize() first.');
    }
    return this.io;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get connected user info
   */
  getConnectedUser(userId) {
    return this.connectedUsers.get(userId);
  }

  /**
   * Get all connected users
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const roles = {};
    
    for (const user of this.connectedUsers.values()) {
      roles[user.role] = (roles[user.role] || 0) + 1;
    }

    return {
      total: this.connectedUsers.size,
      roles,
      timestamp: new Date()
    };
  }
}

// Create singleton instance
const socketServer = new SocketServer();

module.exports = socketServer;
