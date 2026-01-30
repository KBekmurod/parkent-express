const Session = require('../models/Session');

class SessionService {
  async createSession(userId, telegramId, sessionType, initialData = {}, timeoutMinutes = 30) {
    const session = await Session.createSession(
      userId,
      telegramId,
      sessionType,
      initialData,
      timeoutMinutes
    );
    
    return session;
  }
  
  async getSessionById(sessionId) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.isExpired()) {
      session.state = 'expired';
      await session.save();
      throw new Error('Session expired');
    }
    
    return session;
  }
  
  async getActiveSession(userId) {
    const session = await Session.findActiveByUserId(userId);
    
    if (!session) {
      return null;
    }
    
    if (session.isExpired()) {
      session.state = 'expired';
      await session.save();
      return null;
    }
    
    return session;
  }
  
  async getActiveSessionByTelegramId(telegramId) {
    const session = await Session.findActiveByTelegramId(telegramId);
    
    if (!session) {
      return null;
    }
    
    if (session.isExpired()) {
      session.state = 'expired';
      await session.save();
      return null;
    }
    
    return session;
  }
  
  async updateSession(sessionId, data) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!session.isActive()) {
      throw new Error('Session is not active');
    }
    
    await session.updateData(data);
    
    return session;
  }
  
  async updateSessionStep(sessionId, step, stepData = {}) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!session.isActive()) {
      throw new Error('Session is not active');
    }
    
    await session.updateStep(step, stepData);
    
    return session;
  }
  
  async completeSession(sessionId) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    await session.complete();
    
    return session;
  }
  
  async cancelSession(sessionId) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    await session.cancel();
    
    return session;
  }
  
  async cancelUserSessions(userId) {
    await Session.updateMany(
      {
        userId,
        state: 'active'
      },
      {
        $set: { state: 'cancelled' }
      }
    );
    
    return { message: 'All user sessions cancelled' };
  }
  
  async extendSession(sessionId, minutes = 30) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!session.isActive()) {
      throw new Error('Session is not active');
    }
    
    await session.extend(minutes);
    
    return session;
  }
  
  async cleanupExpiredSessions() {
    const count = await Session.cleanupExpired();
    return { cleanedUp: count };
  }
  
  async getSessionData(sessionId) {
    const session = await this.getSessionById(sessionId);
    return session.data;
  }
  
  async getSessionsByUser(userId, state = 'active') {
    const query = { userId };
    
    if (state) {
      query.state = state;
    }
    
    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .limit(10);
    
    return sessions;
  }
}

module.exports = new SessionService();
