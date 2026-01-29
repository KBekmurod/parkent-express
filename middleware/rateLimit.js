const { RateLimiterMemory } = require('rate-limiter-flexible');
const { RATE_LIMIT } = require('../config/constants');

/**
 * Rate limiting middleware to prevent spam
 */
class RateLimitMiddleware {
  constructor() {
    this.rateLimiter = new RateLimiterMemory({
      points: RATE_LIMIT.POINTS, // Number of points
      duration: RATE_LIMIT.DURATION, // Per duration in seconds
      blockDuration: RATE_LIMIT.BLOCK_DURATION // Block for seconds if consumed more than points
    });
  }

  /**
   * Check if user is rate limited
   */
  async checkRateLimit(userId) {
    try {
      await this.rateLimiter.consume(userId);
      return { allowed: true };
    } catch (rejRes) {
      // Rate limit exceeded
      const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000);
      return { 
        allowed: false, 
        retryAfter,
        message: `Juda ko'p so'rov. ${retryAfter} soniyadan keyin qayta urinib ko'ring.`
      };
    }
  }

  /**
   * Reset rate limit for user
   */
  async resetRateLimit(userId) {
    try {
      await this.rateLimiter.delete(userId);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  /**
   * Get remaining points for user
   */
  async getRemainingPoints(userId) {
    try {
      const res = await this.rateLimiter.get(userId);
      if (res) {
        return RATE_LIMIT.POINTS - res.consumedPoints;
      }
      return RATE_LIMIT.POINTS;
    } catch (error) {
      console.error('Error getting remaining points:', error);
      return RATE_LIMIT.POINTS;
    }
  }
}

module.exports = new RateLimitMiddleware();
