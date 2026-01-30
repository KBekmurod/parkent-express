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
    let user = await User.findByTelegramId(telegramId);
    
    // If user not found and it's a registration session, create a temporary user
    if (!user) {
      console.log(`User not found for telegramId: ${telegramId}`);
      
      // For registration sessions, create a temporary user record
      if (sessionType === 'registration') {
        console.log('Creating temporary user for registration session');
        
        // Extract user data from initialData if available
        const userData = {
          telegramId: telegramId,
          username: initialData.username || null,
          firstName: initialData.firstName || 'User',
          lastName: initialData.lastName || null,
          phone: `temp_${telegramId}`, // Temporary phone until user provides real one
          role: 'customer',
          isActive: true,
          isVerified: false,
          metadata: {
            registrationSource: 'telegram',
            lastActivity: new Date()
          }
        };
        
        try {
          user = await User.create(userData);
          console.log(`✅ Temporary user created for telegramId: ${telegramId}`);
        } catch (createError) {
          // If user creation fails due to duplicate key, fetch the existing user
          if (createError.code === 11000) {
            console.log('Duplicate key error, fetching existing user');
            // Try to find user by telegramId first
            user = await User.findOne({ telegramId: telegramId });
            if (!user) {
              // If not found by telegramId, might be phone collision, still try to find
              user = await User.findOne({ phone: `temp_${telegramId}` });
            }
            if (!user) {
              throw new Error('Failed to create or find user after duplicate key error');
            }
          } else {
            throw createError;
          }
        }
      } else {
        // For non-registration sessions, user must exist
        throw new Error('User not found');
      }
    } else {
      console.log(`✅ User loaded for telegramId: ${telegramId}`);
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
