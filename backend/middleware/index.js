/**
 * Middleware Index
 * Central export point for all middleware modules
 */

const authMiddleware = require('./auth.middleware');
const validator = require('./validator');
const errorHandler = require('./errorHandler');
const rateLimit = require('./rateLimit');

module.exports = {
  // Authentication & Authorization
  ...authMiddleware,
  
  // Validation
  ...validator,
  
  // Error Handling
  ...errorHandler,
  
  // Rate Limiting
  ...rateLimit
};
