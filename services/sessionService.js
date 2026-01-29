const Session = require('../models/Session');
const { SESSION_EXPIRATION } = require('../config/constants');

/**
 * Session Service - Manages user sessions across bots
 */
class SessionService {
  /**
   * Get or create session for a user
   */
  async getSession(userId, botType) {
    try {
      let session = await Session.findOne({ userId, botType });
      
      // Create new session if doesn't exist or expired
      if (!session || new Date() > session.expiresAt) {
        session = await this.createSession(userId, botType, 'main_menu');
      }
      
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  /**
   * Create new session
   */
  async createSession(userId, botType, state = 'main_menu', data = {}) {
    try {
      // Delete old session if exists
      await Session.deleteOne({ userId, botType });
      
      const expiresAt = new Date(Date.now() + SESSION_EXPIRATION);
      
      const session = new Session({
        userId,
        botType,
        state,
        data,
        expiresAt
      });
      
      await session.save();
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update session state and data
   */
  async updateSession(userId, botType, state, data = {}) {
    try {
      const expiresAt = new Date(Date.now() + SESSION_EXPIRATION);
      
      const session = await Session.findOneAndUpdate(
        { userId, botType },
        { 
          state, 
          data: { ...data },
          expiresAt 
        },
        { new: true, upsert: true }
      );
      
      return session;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(userId, botType) {
    try {
      await Session.deleteOne({ userId, botType });
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSessionData(userId, botType) {
    try {
      const session = await this.getSession(userId, botType);
      return session ? session.data : {};
    } catch (error) {
      console.error('Error getting session data:', error);
      return {};
    }
  }

  /**
   * Clean up expired sessions (can be called periodically)
   */
  async cleanupExpiredSessions() {
    try {
      const result = await Session.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`Cleaned up ${result.deletedCount} expired sessions`);
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  }
}

module.exports = new SessionService();
