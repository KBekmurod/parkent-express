const Session = require('../../models/Session');
const User = require('../../models/User');

async function getSession(telegramId) {
  try {
    const session = await Session.findActiveByTelegramId(telegramId);
    
    if (!session) {
      return null;
    }
    
    if (session.isExpired()) {
      await session.cancel();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

async function setSession(telegramId, sessionType, initialData = {}, timeoutMinutes = 30) {
  try {
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const session = await Session.createSession(
      user._id,
      telegramId,
      sessionType,
      initialData,
      timeoutMinutes
    );
    
    return session;
  } catch (error) {
    console.error('Set session error:', error);
    throw error;
  }
}

async function updateSession(telegramId, updateData) {
  try {
    const session = await getSession(telegramId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    await session.updateData(updateData);
    
    return session;
  } catch (error) {
    console.error('Update session error:', error);
    throw error;
  }
}

async function updateSessionStep(telegramId, step, stepData = {}) {
  try {
    const session = await getSession(telegramId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    await session.updateStep(step, stepData);
    
    return session;
  } catch (error) {
    console.error('Update session step error:', error);
    throw error;
  }
}

async function clearSession(telegramId) {
  try {
    const session = await getSession(telegramId);
    
    if (session) {
      await session.cancel();
    }
    
    return true;
  } catch (error) {
    console.error('Clear session error:', error);
    return false;
  }
}

async function completeSession(telegramId) {
  try {
    const session = await getSession(telegramId);
    
    if (session) {
      await session.complete();
    }
    
    return true;
  } catch (error) {
    console.error('Complete session error:', error);
    return false;
  }
}

async function extendSession(telegramId, minutes = 30) {
  try {
    const session = await getSession(telegramId);
    
    if (session) {
      await session.extend(minutes);
    }
    
    return session;
  } catch (error) {
    console.error('Extend session error:', error);
    return null;
  }
}

async function cleanupExpiredSessions() {
  try {
    const count = await Session.cleanupExpired();
    console.log(`Cleaned up ${count} expired sessions`);
    return count;
  } catch (error) {
    console.error('Cleanup expired sessions error:', error);
    return 0;
  }
}

module.exports = {
  getSession,
  setSession,
  updateSession,
  updateSessionStep,
  clearSession,
  completeSession,
  extendSession,
  cleanupExpiredSessions
};
