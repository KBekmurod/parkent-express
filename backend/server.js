require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config/config');
const { connectDB, getConnectionStatus } = require('./config/database');
const { initBot, getBotStatus, stopBot } = require('./config/bot');
const { initSocket, getSocketStatus, closeSocket } = require('./config/socket');
const { initSocketHandlers } = require('./socket');
const { morganMiddleware } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./api/routes');
const { createLogger } = require('./utils/logger');
const Session = require('./models/Session');

const logger = createLogger('server');

const app = express();
const server = http.createServer(app);

const PORT = config.port;
const HOST = config.host;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors(config.cors));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morganMiddleware);

if (config.env === 'production') {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  });
  
  app.use('/api/', limiter);
}

app.get('/health', async (req, res) => {
  const dbStatus = getConnectionStatus();
  const botStatus = getBotStatus();
  const socketStatus = getSocketStatus();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    services: {
      database: {
        status: dbStatus.isConnected ? 'connected' : 'disconnected',
        state: dbStatus.state,
        host: dbStatus.host,
        database: dbStatus.name
      },
      bot: {
        status: botStatus.isInitialized ? 'running' : 'stopped',
        mode: botStatus.mode
      },
      socket: {
        status: socketStatus.isInitialized ? 'running' : 'stopped',
        connectedClients: socketStatus.connectedClients
      }
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };
  
  const isHealthy = dbStatus.isConnected && botStatus.isInitialized && socketStatus.isInitialized;
  
  res.status(isHealthy ? 200 : 503).json(health);
});

app.get('/', (req, res) => {
  res.json({
    message: 'Parkent Express Delivery System API',
    version: '1.0.0',
    environment: config.env,
    documentation: '/api/docs',
    health: '/health'
  });
});

app.use('/api', apiRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info('Starting Parkent Express Backend Server...');
    logger.info(`Environment: ${config.env}`);
    
    logger.info('Step 1/4: Connecting to MongoDB...');
    await connectDB();
    logger.info('✓ MongoDB connected successfully');
    
    logger.info('Step 2/4: Initializing Socket.io...');
    const io = initSocket(server);
    initSocketHandlers(io);
    logger.info('✓ Socket.io initialized successfully');
    
    logger.info('Step 3/4: Initializing Telegram Bot...');
    await initBot();
    logger.info('✓ Telegram Bot initialized successfully');
    
    logger.info('Step 4/4: Starting Express server...');
    server.listen(PORT, HOST, () => {
      logger.info('✓ Server started successfully');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
      logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
      logger.info(`🔌 Socket.io ready for connections`);
      logger.info(`🤖 Telegram Bot is ${getBotStatus().mode === 'webhook' ? 'listening via webhook' : 'polling for updates'}`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    
    setInterval(async () => {
      try {
        await Session.cleanupExpired();
      } catch (error) {
        logger.error('Error cleaning up expired sessions:', error);
      }
    }, 5 * 60 * 1000);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    logger.info('Closing HTTP server...');
    server.close(() => {
      logger.info('✓ HTTP server closed');
    });
    
    logger.info('Closing Socket.io connections...');
    await closeSocket();
    logger.info('✓ Socket.io connections closed');
    
    logger.info('Stopping Telegram Bot...');
    await stopBot();
    logger.info('✓ Telegram Bot stopped');
    
    logger.info('Closing database connection...');
    const { disconnectDB } = require('./config/database');
    await disconnectDB();
    logger.info('✓ Database connection closed');
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

if (require.main === module) {
  startServer();
}

module.exports = { app, server };
