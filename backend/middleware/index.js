const { authenticate, authorize, optionalAuth } = require('./auth');
const validate = require('./validation');
const { morganMiddleware, requestLogger } = require('./logger');
const { errorHandler, notFoundHandler } = require('./errorHandler');

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  validate,
  morganMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler
};
