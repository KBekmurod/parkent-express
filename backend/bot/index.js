const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const Session = require('../models/Session');
const messages = require('./messages/uzbek.messages');
const sessionManager = require('./middleware/sessionManager');

const { setupCustomerHandlers } = require('./handlers/customer.handler');
const { setupVendorHandlers } = require('./handlers/vendor.handler');
const { setupCourierHandlers } = require('./handlers/courier.handler');
const { setupAdminHandlers } = require('./handlers/admin.handler');

const { setupCustomerRegistrationScene } = require('./scenes/customerRegistration.scene');
const { setupOrderCreationScene } = require('./scenes/orderCreation.scene');
const { setupVendorRegistrationScene } = require('./scenes/vendorRegistration.scene');
const { setupProductAddScene } = require('./scenes/productAdd.scene');

const keyboards = require('./keyboards/customer.keyboards');

let bot;

function initializeBot() {
  const token = process.env.BOT_TOKEN;
  
  if (!token) {
    console.error('BOT_TOKEN is not defined in environment variables');
    return null;
  }
  
  try {
    bot = new TelegramBot(token, { 
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    
    console.log('✅ Telegram bot initialized successfully');
    
    setupCommands();
    setupHandlers();
    setupScenes();
    setupErrorHandling();
    
    setInterval(() => {
      sessionManager.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
    
    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return null;
  }
}

function setupCommands() {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name;
    
    try {
      let user = await User.findByTelegramId(telegramId);
      
      if (!user) {
        await sessionManager.setSession(telegramId, 'registration', {
          step: 'enter_name',
          telegramId,
          username,
          firstName,
          lastName
        });
        
        await bot.sendMessage(
          chatId,
          messages.welcome(firstName),
          { parse_mode: 'HTML' }
        );
        
        await bot.sendMessage(
          chatId,
          'Iltimos, to\'liq ismingizni kiriting:',
          { reply_markup: { remove_keyboard: true } }
        );
        
        return;
      }
      
      user.metadata = user.metadata || {};
      user.metadata.lastLogin = new Date();
      user.metadata.lastActivity = new Date();
      await user.save();
      
      await routeToRoleHandler(bot, msg, user);
      
    } catch (error) {
      console.error('Start command error:', error);
      await bot.sendMessage(chatId, messages.errorOccurred);
    }
  });
  
  bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    
    try {
      await sessionManager.clearSession(telegramId);
      
      const user = await User.findByTelegramId(telegramId);
      
      if (user) {
        await bot.sendMessage(chatId, messages.actionCancelled);
        await routeToRoleHandler(bot, msg, user);
      } else {
        await bot.sendMessage(chatId, messages.actionCancelled);
      }
    } catch (error) {
      console.error('Cancel command error:', error);
      await bot.sendMessage(chatId, messages.errorOccurred);
    }
  });
  
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, messages.helpMessage);
  });
  
  bot.onText(/\/menu/, async (msg) => {
    const telegramId = msg.from.id.toString();
    
    try {
      const user = await User.findByTelegramId(telegramId);
      
      if (user) {
        await routeToRoleHandler(bot, msg, user);
      } else {
        await bot.sendMessage(msg.chat.id, 'Iltimos, /start buyrug\'ini bosing');
      }
    } catch (error) {
      console.error('Menu command error:', error);
      await bot.sendMessage(msg.chat.id, messages.errorOccurred);
    }
  });
  
  bot.onText(/\/status/, async (msg) => {
    const telegramId = msg.from.id.toString();
    
    try {
      const user = await User.findByTelegramId(telegramId);
      
      if (!user) {
        await bot.sendMessage(msg.chat.id, 'Siz ro\'yxatdan o\'tmagansiz. /start ni bosing.');
        return;
      }
      
      const session = await sessionManager.getSession(telegramId);
      
      let statusText = `ℹ️ Sizning ma'lumotlaringiz\n\n`;
      statusText += `Ism: ${user.firstName}${user.lastName ? ' ' + user.lastName : ''}\n`;
      statusText += `Rol: ${messages.getRoleText(user.role)}\n`;
      statusText += `Telefon: ${user.phone}\n`;
      statusText += `Holat: ${user.isActive ? '✅ Faol' : '❌ Nofaol'}\n`;
      
      if (session) {
        statusText += `\n📝 Faol sessiya: ${session.sessionType}`;
      }
      
      await bot.sendMessage(msg.chat.id, statusText);
    } catch (error) {
      console.error('Status command error:', error);
      await bot.sendMessage(msg.chat.id, messages.errorOccurred);
    }
  });
}

async function routeToRoleHandler(bot, msg, user) {
  const chatId = msg.chat.id;
  
  try {
    switch (user.role) {
      case 'customer':
        await bot.sendMessage(
          chatId,
          messages.welcomeCustomer(user.firstName),
          keyboards.mainMenu()
        );
        break;
        
      case 'vendor':
        await bot.sendMessage(
          chatId,
          messages.welcomeVendor(user.firstName),
          require('./keyboards/vendor.keyboards').mainMenu()
        );
        break;
        
      case 'courier':
        await bot.sendMessage(
          chatId,
          messages.welcomeCourier(user.firstName),
          require('./keyboards/courier.keyboards').mainMenu()
        );
        break;
        
      case 'admin':
        await bot.sendMessage(
          chatId,
          messages.welcomeAdmin(user.firstName),
          require('./keyboards/admin.keyboards').mainMenu()
        );
        break;
        
      default:
        await bot.sendMessage(
          chatId,
          messages.welcomeCustomer(user.firstName),
          keyboards.mainMenu()
        );
    }
  } catch (error) {
    console.error('Route to role handler error:', error);
    await bot.sendMessage(chatId, messages.errorOccurred);
  }
}

function setupHandlers() {
  try {
    setupCustomerHandlers(bot);
    setupVendorHandlers(bot);
    setupCourierHandlers(bot);
    setupAdminHandlers(bot);
    
    console.log('✅ Bot handlers initialized');
  } catch (error) {
    console.error('Failed to setup handlers:', error);
  }
}

function setupScenes() {
  try {
    setupCustomerRegistrationScene(bot);
    setupOrderCreationScene(bot);
    setupVendorRegistrationScene(bot);
    setupProductAddScene(bot);
    
    console.log('✅ Bot scenes initialized');
  } catch (error) {
    console.error('Failed to setup scenes:', error);
  }
}

function setupErrorHandling() {
  bot.on('polling_error', (error) => {
    console.error('Polling error:', error.code, error.message);
  });
  
  bot.on('error', (error) => {
    console.error('Bot error:', error);
  });
  
  process.on('SIGINT', () => {
    console.log('Stopping Telegram bot...');
    if (bot) {
      bot.stopPolling();
    }
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Stopping Telegram bot...');
    if (bot) {
      bot.stopPolling();
    }
    process.exit(0);
  });
}

async function sendMessage(chatId, text, options = {}) {
  if (!bot) {
    console.error('Bot is not initialized');
    return false;
  }
  
  try {
    await bot.sendMessage(chatId, text, options);
    return true;
  } catch (error) {
    console.error('Send message error:', error);
    return false;
  }
}

async function sendNotification(userId, message) {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.telegramId) {
      return false;
    }
    
    if (!user.notificationSettings?.telegram) {
      return false;
    }
    
    return await sendMessage(user.telegramId, message);
  } catch (error) {
    console.error('Send notification error:', error);
    return false;
  }
}

async function notifyNewOrder(order) {
  if (!order.vendor || !order.vendor.owner) {
    return false;
  }
  
  try {
    const vendor = await User.findById(order.vendor.owner);
    
    if (vendor && vendor.telegramId) {
      const message = messages.newOrderNotification(order);
      return await sendMessage(vendor.telegramId, message);
    }
    
    return false;
  } catch (error) {
    console.error('Notify new order error:', error);
    return false;
  }
}

async function notifyOrderStatusChange(orderId, newStatus) {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(orderId)
      .populate('customer', 'telegramId firstName')
      .populate('courier', 'telegramId firstName')
      .populate('vendor');
    
    if (!order) {
      return false;
    }
    
    let message = '';
    let recipientId = null;
    
    switch (newStatus) {
      case 'confirmed':
        message = messages.orderConfirmedByVendor(order.orderNumber, order.preparationTime);
        recipientId = order.customer?.telegramId;
        break;
        
      case 'preparing':
        message = messages.orderPreparing(order.orderNumber);
        recipientId = order.customer?.telegramId;
        break;
        
      case 'ready':
        message = messages.orderReady(order.orderNumber);
        recipientId = order.customer?.telegramId;
        break;
        
      case 'assigned':
        message = messages.orderAssignedToCourier(order.orderNumber, order.courier?.firstName || 'Kurier');
        recipientId = order.customer?.telegramId;
        break;
        
      case 'picked_up':
        message = messages.orderPickedUp(order.orderNumber);
        recipientId = order.customer?.telegramId;
        break;
        
      case 'delivered':
        message = messages.orderDelivered(order.orderNumber);
        recipientId = order.customer?.telegramId;
        break;
        
      case 'cancelled':
      case 'rejected':
        message = messages.orderRejectedByVendor(order.orderNumber, order.cancellationReason);
        recipientId = order.customer?.telegramId;
        break;
    }
    
    if (message && recipientId) {
      return await sendMessage(recipientId, message);
    }
    
    return false;
  } catch (error) {
    console.error('Notify order status change error:', error);
    return false;
  }
}

function getBot() {
  return bot;
}

module.exports = {
  initializeBot,
  getBot,
  sendMessage,
  sendNotification,
  notifyNewOrder,
  notifyOrderStatusChange
};
