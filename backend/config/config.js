require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || 'localhost',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  location: {
    parkentCenter: {
      lat: parseFloat(process.env.PARKENT_CENTER_LAT) || 41.299164,
      lon: parseFloat(process.env.PARKENT_CENTER_LON) || 69.685219
    },
    maxDeliveryRadiusKm: parseFloat(process.env.MAX_DELIVERY_RADIUS_KM) || 10
  },
  
  notification: {
    retryAttempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.NOTIFICATION_RETRY_DELAY, 10) || 5000
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  },
  
  session: {
    timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10) || 30
  },
  
  payment: {
    commissionRate: parseFloat(process.env.COMMISSION_RATE) || 0.10,
    minOrderAmount: parseInt(process.env.MIN_ORDER_AMOUNT, 10) || 5000,
    currency: process.env.CURRENCY || 'UZS'
  },
  
  admin: {
    telegramId: process.env.ADMIN_TELEGRAM_ID
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
};
