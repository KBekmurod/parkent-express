const User = require('../../models/User');
const messages = require('../messages/uzbek.messages');

async function checkRole(requiredRole) {
  return async (msg) => {
    const telegramId = msg.from.id.toString();
    
    try {
      const user = await User.findByTelegramId(telegramId);
      
      if (!user) {
        return {
          authorized: false,
          message: messages.errorOccurred
        };
      }
      
      if (!user.isActive) {
        return {
          authorized: false,
          message: messages.errorOccurred
        };
      }
      
      if (Array.isArray(requiredRole)) {
        if (!requiredRole.includes(user.role)) {
          return {
            authorized: false,
            message: messages.unauthorizedAccess(requiredRole[0])
          };
        }
      } else {
        if (user.role !== requiredRole) {
          return {
            authorized: false,
            message: messages.unauthorizedAccess(requiredRole)
          };
        }
      }
      
      return {
        authorized: true,
        user
      };
    } catch (error) {
      console.error('Role check error:', error);
      return {
        authorized: false,
        message: messages.errorOccurred
      };
    }
  };
}

async function requireRole(bot, msg, requiredRole) {
  const telegramId = msg.from.id.toString();
  
  try {
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      await bot.sendMessage(msg.chat.id, messages.errorOccurred);
      return null;
    }
    
    if (!user.isActive) {
      await bot.sendMessage(msg.chat.id, messages.errorOccurred);
      return null;
    }
    
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(user.role)) {
        await bot.sendMessage(msg.chat.id, messages.unauthorizedAccess(requiredRole[0]));
        return null;
      }
    } else {
      if (user.role !== requiredRole) {
        await bot.sendMessage(msg.chat.id, messages.unauthorizedAccess(requiredRole));
        return null;
      }
    }
    
    return user;
  } catch (error) {
    console.error('Require role error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred);
    return null;
  }
}

module.exports = {
  checkRole,
  requireRole
};
