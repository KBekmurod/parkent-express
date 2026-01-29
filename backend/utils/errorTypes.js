const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

class BaseError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true) {
    super(message);
    
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        timestamp: this.timestamp
      }
    };
  }
}

class ValidationError extends BaseError {
  constructor(message = 'Validation failed', details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

class NotFoundError extends BaseError {
  constructor(message = 'Resource not found', resource = null) {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    this.resource = resource;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        resource: this.resource,
        timestamp: this.timestamp
      }
    };
  }
}

class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized access') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

class ForbiddenError extends BaseError {
  constructor(message = 'Access forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

class ConflictError extends BaseError {
  constructor(message = 'Resource conflict', conflictField = null) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    this.conflictField = conflictField;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        conflictField: this.conflictField,
        timestamp: this.timestamp
      }
    };
  }
}

class DuplicateError extends BaseError {
  constructor(message = 'Duplicate resource', field = null) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_ERROR);
    this.field = field;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        field: this.field,
        timestamp: this.timestamp
      }
    };
  }
}

class BadRequestError extends BaseError {
  constructor(message = 'Bad request') {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST);
  }
}

class InternalError extends BaseError {
  constructor(message = 'Internal server error', isOperational = false) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, isOperational);
  }
}

class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_CODES.INTERNAL_ERROR);
  }
}

class TooManyRequestsError extends BaseError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.BAD_REQUEST);
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        retryAfter: this.retryAfter,
        timestamp: this.timestamp
      }
    };
  }
}

class DatabaseError extends BaseError {
  constructor(message = 'Database operation failed', operation = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, false);
    this.operation = operation;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        operation: this.operation,
        timestamp: this.timestamp
      }
    };
  }
}

class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

class TokenExpiredError extends BaseError {
  constructor(message = 'Token has expired') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

class InvalidTokenError extends BaseError {
  constructor(message = 'Invalid token provided') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

const isOperationalError = (error) => {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
};

const handleError = (error, logger) => {
  if (logger) {
    if (isOperationalError(error)) {
      logger.warn('Operational error occurred', {
        name: error.name,
        message: error.message,
        code: error.errorCode,
        statusCode: error.statusCode
      });
    } else {
      logger.error('Non-operational error occurred', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }
};

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof BaseError)) {
    if (err.name === 'ValidationError') {
      error = new ValidationError(err.message, err.errors);
    } else if (err.name === 'CastError') {
      error = new BadRequestError(`Invalid ${err.path}: ${err.value}`);
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      error = new DuplicateError(`${field} already exists`, field);
    } else if (err.name === 'JsonWebTokenError') {
      error = new InvalidTokenError();
    } else if (err.name === 'TokenExpiredError') {
      error = new TokenExpiredError();
    } else {
      error = new InternalError(
        process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
      );
    }
  }

  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const response = error.toJSON ? error.toJSON() : {
    error: {
      name: error.name,
      message: error.message,
      statusCode
    }
  };

  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  BaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DuplicateError,
  BadRequestError,
  InternalError,
  ServiceUnavailableError,
  TooManyRequestsError,
  DatabaseError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  isOperationalError,
  handleError,
  errorMiddleware
};
