const logger = require('../utils/logger');
const { 
  BaseError, 
  InternalError,
  isOperationalError 
} = require('../utils/errorTypes');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Send notification to admin for critical errors
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 */
const notifyAdmin = async (error, req) => {
  try {
    const adminTelegramId = process.env.ADMIN_TELEGRAM_ID;
    
    if (!adminTelegramId) {
      logger.warn('ADMIN_TELEGRAM_ID not configured - skipping admin notification');
      return;
    }

    // Dynamically require to avoid circular dependencies
    const notificationService = require('../services/notificationService');
    
    const errorDetails = {
      timestamp: new Date().toISOString(),
      error: error.message,
      statusCode: error.statusCode || 500,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.userId || 'anonymous',
      userRole: req.user?.role || 'none'
    };

    const message = `🚨 *CRITICAL ERROR*\n\n` +
      `*Time:* ${errorDetails.timestamp}\n` +
      `*Error:* ${errorDetails.error}\n` +
      `*Status:* ${errorDetails.statusCode}\n` +
      `*Method:* ${errorDetails.method}\n` +
      `*URL:* ${errorDetails.url}\n` +
      `*IP:* ${errorDetails.ip}\n` +
      `*User:* ${errorDetails.userId} (${errorDetails.userRole})`;

    await notificationService.sendToTelegram(adminTelegramId, message);
  } catch (notificationError) {
    logger.error('Failed to send admin notification', {
      error: notificationError.message,
      originalError: error.message
    });
  }
};

/**
 * Log error with appropriate level
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 */
const logError = (error, req) => {
  const logData = {
    error: error.message,
    statusCode: error.statusCode || 500,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.userId,
    userRole: req.user?.role,
    body: req.body,
    params: req.params,
    query: req.query
  };

  if (error.statusCode && error.statusCode < 500) {
    logger.warn('Client error occurred', logData);
  } else {
    logData.stack = error.stack;
    logger.error('Server error occurred', logData);
  }
};

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
const errorHandler = async (err, req, res, next) => {
  try {
    let error = err;

    // Convert non-operational errors to BaseError
    if (!(error instanceof BaseError)) {
      if (err.name === 'ValidationError') {
        const { ValidationError } = require('../utils/errorTypes');
        error = new ValidationError(err.message, err.errors);
      } else if (err.name === 'CastError') {
        const { BadRequestError } = require('../utils/errorTypes');
        error = new BadRequestError(`Invalid ${err.path}: ${err.value}`);
      } else if (err.code === 11000) {
        const { DuplicateError } = require('../utils/errorTypes');
        const field = Object.keys(err.keyPattern)[0];
        error = new DuplicateError(`${field} already exists`, field);
      } else if (err.name === 'JsonWebTokenError') {
        const { InvalidTokenError } = require('../utils/errorTypes');
        error = new InvalidTokenError();
      } else if (err.name === 'TokenExpiredError') {
        const { TokenExpiredError } = require('../utils/errorTypes');
        error = new TokenExpiredError();
      } else if (err.name === 'MulterError') {
        const { BadRequestError } = require('../utils/errorTypes');
        error = new BadRequestError(`File upload error: ${err.message}`);
      } else {
        error = new InternalError(
          process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
        );
      }
    }

    // Log the error
    logError(error, req);

    // Notify admin for 500 errors
    if (error.statusCode >= 500) {
      await notifyAdmin(error, req);
    }

    // Prepare response
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const response = error.toJSON ? error.toJSON() : {
      error: {
        name: error.name,
        message: error.message,
        statusCode
      }
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
      response.error.stack = error.stack.split('\n');
    }

    // Add request ID if available
    if (req.id) {
      response.error.requestId = req.id;
    }

    // Send response
    res.status(statusCode).json(response);
  } catch (handlerError) {
    logger.error('Error in error handler', {
      error: handlerError.message,
      stack: handlerError.stack,
      originalError: err.message
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        name: 'InternalError',
        message: 'An unexpected error occurred',
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR
      }
    });
  }
};

/**
 * Handle 404 Not Found errors
 */
const notFoundHandler = (req, res, next) => {
  const { NotFoundError } = require('../utils/errorTypes');
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Async handler wrapper to catch promise rejections
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason,
      promise: promise
    });
    
    // Don't exit in production, just log
    if (process.env.NODE_ENV !== 'production') {
      throw reason;
    }
  });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    
    // Give logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

/**
 * Register global error handlers
 */
const registerGlobalHandlers = () => {
  handleUnhandledRejection();
  handleUncaughtException();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  registerGlobalHandlers,
  logError,
  notifyAdmin
};
