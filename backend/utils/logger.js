const winston = require('winston');
const path = require('path');

const logDir = process.env.LOG_DIR || 'logs';
const logLevel = process.env.LOG_LEVEL || 'info';
const environment = process.env.NODE_ENV || 'development';

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  }
};

winston.addColors(customLevels.colors);

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf((info) => {
    const { timestamp, level, message, metadata } = info;
    
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      log += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    
    return log;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, metadata } = info;
    
    let log = `${timestamp} ${level}: ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }
    
    return log;
  })
);

const fileRotateTransport = (filename, level) => {
  return new winston.transports.File({
    filename: path.join(logDir, filename),
    level: level,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: customFormat
  });
};

const transports = [
  new winston.transports.Console({
    level: logLevel,
    format: consoleFormat,
    handleExceptions: true
  }),
  fileRotateTransport('error.log', 'error'),
  fileRotateTransport('combined.log', 'info')
];

if (environment === 'development') {
  transports.push(fileRotateTransport('debug.log', 'debug'));
}

const logger = winston.createLogger({
  level: logLevel,
  levels: customLevels.levels,
  format: customFormat,
  transports,
  exitOnError: false,
  silent: environment === 'test'
});

logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });

  next();
};

const errorLogger = (err, req, res, next) => {
  logger.error('Express Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(err);
};

let handlersRegistered = false;

const registerGlobalHandlers = () => {
  if (handlersRegistered) {
    return;
  }

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason,
      promise: promise
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    
    process.exit(1);
  });

  handlersRegistered = true;
};

if (environment !== 'test') {
  registerGlobalHandlers();
}

module.exports = logger;
module.exports.requestLogger = requestLogger;
module.exports.errorLogger = errorLogger;
