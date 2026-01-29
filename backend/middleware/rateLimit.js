const rateLimit = require('express-rate-limit');
const { TooManyRequestsError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

/**
 * Get rate limit configuration from environment variables
 */
const getRateLimitConfig = () => ({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute default
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5
});

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res, next) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.userId
  });

  const error = new TooManyRequestsError(
    'Too many requests from this IP, please try again later',
    Math.ceil(req.rateLimit.resetTime / 1000)
  );

  res.status(error.statusCode).json(error.toJSON());
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimit = (req) => {
  // Skip rate limiting for admin users
  if (req.user && req.user.role === 'admin') {
    return true;
  }

  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  return false;
};

/**
 * Key generator for rate limiting
 * Can be customized to use user ID instead of IP for authenticated requests
 */
const keyGenerator = (req) => {
  if (req.user && req.user.userId) {
    return `user_${req.user.userId}`;
  }
  return req.ip;
};

/**
 * Standard rate limiter (5 requests per minute per IP)
 */
const standardLimiter = rateLimit({
  windowMs: getRateLimitConfig().windowMs,
  max: getRateLimitConfig().maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: keyGenerator,
  handler: rateLimitHandler
});

/**
 * Strict rate limiter for sensitive operations (3 requests per minute)
 */
const strictLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 3,
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: keyGenerator,
  handler: rateLimitHandler
});

/**
 * Auth rate limiter for login/register endpoints (5 requests per 5 minutes)
 */
const authLimiter = rateLimit({
  windowMs: 5 * 60000, // 5 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => req.ip,
  handler: rateLimitHandler
});

/**
 * Generous rate limiter for public endpoints (100 requests per minute)
 */
const publicLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: keyGenerator,
  handler: rateLimitHandler
});

/**
 * API rate limiter for general API endpoints (30 requests per minute)
 */
const apiLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 30,
  message: 'API rate limit exceeded, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: keyGenerator,
  handler: rateLimitHandler
});

/**
 * File upload rate limiter (5 uploads per 5 minutes)
 */
const uploadLimiter = rateLimit({
  windowMs: 5 * 60000, // 5 minutes
  max: 5,
  message: 'Too many file uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: keyGenerator,
  handler: rateLimitHandler
});

/**
 * Order creation rate limiter (10 orders per hour)
 */
const orderLimiter = rateLimit({
  windowMs: 60 * 60000, // 1 hour
  max: 10,
  message: 'Too many orders created, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: keyGenerator,
  handler: rateLimitHandler
});

/**
 * Create custom rate limiter with specific options
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
const createLimiter = (options) => {
  const defaults = {
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipRateLimit,
    keyGenerator: keyGenerator,
    handler: rateLimitHandler
  };

  return rateLimit({ ...defaults, ...options });
};

module.exports = {
  standardLimiter,
  strictLimiter,
  authLimiter,
  publicLimiter,
  apiLimiter,
  uploadLimiter,
  orderLimiter,
  createLimiter,
  getRateLimitConfig
};
