const morgan = require('morgan');
const { createLogger } = require('../utils/logger');

const logger = createLogger('http');

const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.userId || null
    });
  });
  
  next();
};

module.exports = {
  morganMiddleware,
  requestLogger
};
