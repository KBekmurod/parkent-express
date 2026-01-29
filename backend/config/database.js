const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
    this.maxRetries = 5;
    this.retryDelay = 5000;
    this.currentRetry = 0;
  }

  async connect() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/parkent-express';
    
    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    };

    try {
      mongoose.set('strictQuery', true);

      this.connection = await mongoose.connect(mongoUri, options);

      logger.info('MongoDB connected successfully', {
        host: this.connection.connection.host,
        database: this.connection.connection.name,
        port: this.connection.connection.port
      });

      this.setupEventHandlers();
      this.currentRetry = 0;

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection error:', {
        error: error.message,
        stack: error.stack,
        retry: this.currentRetry
      });

      if (this.currentRetry < this.maxRetries) {
        this.currentRetry++;
        const delay = this.retryDelay * this.currentRetry;
        
        logger.info(`Retrying connection in ${delay / 1000} seconds... (Attempt ${this.currentRetry}/${this.maxRetries})`);
        
        await this.sleep(delay);
        return this.connect();
      } else {
        logger.error('Max retry attempts reached. Could not connect to MongoDB.');
        throw new Error('Failed to connect to MongoDB after maximum retries');
      }
    }
  }

  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', {
        error: err.message,
        stack: err.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      
      if (this.currentRetry < this.maxRetries) {
        logger.info('Attempting to reconnect...');
        this.connect();
      }
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB');
      this.currentRetry = 0;
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed successfully');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async checkHealth() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      const isHealthy = state === 1;
      
      return {
        isHealthy,
        state: states[state],
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      };
    } catch (error) {
      logger.error('Health check failed:', {
        error: error.message
      });
      
      return {
        isHealthy: false,
        error: error.message
      };
    }
  }

  async ping() {
    try {
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('Database ping failed:', {
        error: error.message
      });
      return false;
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createIndexes() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      for (const collection of collections) {
        const model = mongoose.models[collection.name];
        if (model) {
          await model.createIndexes();
          logger.info(`Indexes created for collection: ${collection.name}`);
        }
      }
      
      logger.info('All indexes created successfully');
    } catch (error) {
      logger.error('Error creating indexes:', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  async dropDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }

    try {
      await mongoose.connection.dropDatabase();
      logger.warn('Database dropped successfully');
    } catch (error) {
      logger.error('Error dropping database:', {
        error: error.message
      });
      throw error;
    }
  }

  async clearCollection(collectionName) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear collections in production environment');
    }

    try {
      await mongoose.connection.collection(collectionName).deleteMany({});
      logger.warn(`Collection ${collectionName} cleared successfully`);
    } catch (error) {
      logger.error(`Error clearing collection ${collectionName}:`, {
        error: error.message
      });
      throw error;
    }
  }
}

const database = new Database();

module.exports = database;
