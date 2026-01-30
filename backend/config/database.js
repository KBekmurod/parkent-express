const mongoose = require('mongoose');
const { createLogger } = require('../utils/logger');

const logger = createLogger('database');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/parkent-express';

const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
  family: 4
};

let isConnected = false;
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

async function reconnectWithRetry(retryCount = 0) {
  if (retryCount >= MAX_RECONNECTION_ATTEMPTS) {
    logger.error('❌ Max reconnection attempts reached. Exiting...');
    process.exit(1);
  }

  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
  logger.info(`🔄 Reconnecting to MongoDB in ${delay/1000}s... (Attempt ${retryCount + 1}/${MAX_RECONNECTION_ATTEMPTS})`);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  try {
    await mongoose.connect(mongoUri, options);
    logger.info('✅ MongoDB reconnected successfully');
    reconnectionAttempts = 0; // Reset counter on success
    isConnected = true;
  } catch (error) {
    logger.error('❌ Reconnection failed:', error.message);
    await reconnectWithRetry(retryCount + 1);
  }
}

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(mongoUri, options);
    
    isConnected = true;
    
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', async (err) => {
      logger.error('❌ MongoDB connection error:', err);
      isConnected = false;
      
      // Don't auto-reconnect on initial connection - mongoose handles it
      // Only reconnect on runtime errors
      if (mongoose.connection.readyState === 0) {
        await reconnectWithRetry(reconnectionAttempts++);
      }
    });
    
    mongoose.connection.on('disconnected', async () => {
      logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      isConnected = false;
      
      // Wait a bit before reconnecting to avoid rapid reconnection attempts
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (mongoose.connection.readyState === 0) {
        await reconnectWithRetry(reconnectionAttempts++);
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
      reconnectionAttempts = 0;
      isConnected = true;
    });
    
    mongoose.connection.on('close', () => {
      logger.info('🔌 MongoDB connection closed');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('🛑 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error(`❌ Initial MongoDB connection failed: ${error.message}`);
    await reconnectWithRetry(reconnectionAttempts++);
  }
};

const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    isConnected,
    state: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  mongoose
};
