const { createLogger } = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

const logger = createLogger('error');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    userId: req.userId || null
  });
  
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation error',
        details: Object.values(err.errors).map(error => ({
          field: error.path,
          message: error.message
        }))
      }
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid ID format'
      }
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      error: {
        code: ERROR_CODES.DUPLICATE_ERROR,
        message: `${field} already exists`,
        field
      }
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Invalid token'
      }
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Token expired'
      }
    });
  }
  
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const errorCode = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${req.originalUrl} not found`
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
