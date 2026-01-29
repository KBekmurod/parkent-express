const TelegramBot = require('node-telegram-bot-api');
const sessionService = require('../services/sessionService');
const orderService = require('../services/orderService');
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimit');
const { adminKeyboards } = require('../utils/keyboard');
const messages = require('../utils/messages');
const { ADMIN_STATES, BOT_TYPES } = require('../config/constants');

/**
 * Admin Bot - Handles admin operations
 */
class AdminBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
    console.log('Admin bot started');
  }

  setupHandlers() {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // Handle text messages
    this.bot.on('message', async (msg) => {
      // Skip if it's a command
      if (msg.text && msg.text.startsWith('/')) return;
      
      await this.handleMessage(msg);
    });

    // Handle callback queries
    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Admin bot polling error:', error);
    });
  }

  async handleStart(msg) {
    const userId = msg.from.id;

    try {
      // Check if user is admin
      const isAdmin = await authMiddleware.isAdmin(userId);
      if (!isAdmin) {
        await this.bot.sendMessage(userId, messages.admin.notAuthorized);
        return;
      }

      // Reset session
      await sessionService.createSession(userId, BOT_TYPES.ADMIN, ADMIN_STATES.MAIN_MENU);

      // Send welcome message
      await this.bot.sendMessage(
        userId,
        messages.admin.welcome,
        { reply_markup: adminKeyboards.mainMenu() }
      );
    } catch (error) {
      console.error('Error in handleStart:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async handleMessage(msg) {
    const userId = msg.from.id;

    try {
      // Check if user is admin
      const isAdmin = await authMiddleware.isAdmin(userId);
      if (!isAdmin) {
        await this.bot.sendMessage(userId, messages.admin.notAuthorized);
        return;
      }

      // Get session
      const session = await sessionService.getSession(userId, BOT_TYPES.ADMIN);

      // Handle based on state
      if (session.state === 'awaiting_courier_id') {
        await this.handleCourierIdInput(msg, session);
      }
    } catch (error) {
      console.error('Error in handleMessage:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async handleCallbackQuery(query) {
    const userId = query.from.id;
    const data = query.data;

    try {
      // Check if user is admin
      const isAdmin = await authMiddleware.isAdmin(userId);
      if (!isAdmin) {
        await this.bot.answerCallbackQuery(query.id, { 
          text: messages.admin.notAuthorized,
          show_alert: true 
        });
        return;
      }

      // Handle callback
      switch (data) {
        case 'admin_orders':
          await this.showOrders(userId);
          break;
        case 'admin_couriers':
          await this.showCourierManagement(userId);
          break;
        case 'admin_stats':
          await this.showStatistics(userId);
          break;
        case 'admin_settings':
          await this.showSettings(userId);
          break;
        case 'filter_all':
          await this.showOrdersByFilter(userId, null);
          break;
        case 'filter_pending':
          await this.showOrdersByFilter(userId, 'pending');
          break;
        case 'filter_delivering':
          await this.showOrdersByFilter(userId, 'delivering');
          break;
        case 'filter_delivered':
          await this.showOrdersByFilter(userId, 'delivered');
          break;
        case 'add_courier':
          await this.startAddCourier(userId);
          break;
        case 'list_couriers':
          await this.showCouriersList(userId);
          break;
        case 'main_menu':
          await this.showMainMenu(userId);
          break;
      }

      await this.bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Error in handleCallbackQuery:', error);
      await this.bot.answerCallbackQuery(query.id, { 
        text: messages.customer.errorOccurred,
        show_alert: true 
      });
    }
  }

  async showOrders(userId) {
    try {
      await this.bot.sendMessage(
        userId,
        messages.admin.ordersTitle,
        { reply_markup: adminKeyboards.orderFilters() }
      );
    } catch (error) {
      console.error('Error showing orders:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async showOrdersByFilter(userId, status) {
    try {
      const filters = {};
      if (status) {
        filters.status = status;
      }

      const orders = await orderService.getAllOrders(filters, 10);

      if (orders.length === 0) {
        await this.bot.sendMessage(
          userId,
          messages.admin.noOrders,
          { reply_markup: adminKeyboards.backToMainMenu() }
        );
        return;
      }

      const messageText = messages.admin.ordersList(orders);

      await this.bot.sendMessage(
        userId,
        messageText,
        { reply_markup: adminKeyboards.backToMainMenu() }
      );
    } catch (error) {
      console.error('Error showing orders by filter:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async showCourierManagement(userId) {
    try {
      await this.bot.sendMessage(
        userId,
        messages.admin.couriersTitle,
        { reply_markup: adminKeyboards.courierManagement() }
      );
    } catch (error) {
      console.error('Error showing courier management:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async startAddCourier(userId) {
    try {
      // Update session state
      await sessionService.updateSession(userId, BOT_TYPES.ADMIN, 'awaiting_courier_id', {});

      await this.bot.sendMessage(
        userId,
        messages.admin.addCourierPrompt,
        { reply_markup: adminKeyboards.backToMainMenu() }
      );
    } catch (error) {
      console.error('Error starting add courier:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async handleCourierIdInput(msg, session) {
    const userId = msg.from.id;
    const courierIdText = msg.text;

    try {
      // Validate that it's a number
      const courierId = parseInt(courierIdText);
      if (isNaN(courierId)) {
        await this.bot.sendMessage(userId, messages.admin.invalidCourierId);
        return;
      }

      // Register courier
      await authMiddleware.registerCourier(courierId);

      // Reset session
      await sessionService.updateSession(userId, BOT_TYPES.ADMIN, ADMIN_STATES.MAIN_MENU, {});

      await this.bot.sendMessage(
        userId,
        messages.admin.courierAdded(courierId),
        { reply_markup: adminKeyboards.mainMenu() }
      );
    } catch (error) {
      console.error('Error handling courier ID input:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async showCouriersList(userId) {
    try {
      const couriers = await authMiddleware.getAllCouriers();

      if (couriers.length === 0) {
        await this.bot.sendMessage(
          userId,
          messages.admin.noCouriers,
          { reply_markup: adminKeyboards.backToMainMenu() }
        );
        return;
      }

      const messageText = messages.admin.couriersList(couriers);

      await this.bot.sendMessage(
        userId,
        messageText,
        { reply_markup: adminKeyboards.backToMainMenu() }
      );
    } catch (error) {
      console.error('Error showing couriers list:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async showStatistics(userId) {
    try {
      const stats = await orderService.getStatistics();

      await this.bot.sendMessage(
        userId,
        messages.admin.statistics(stats),
        { reply_markup: adminKeyboards.backToMainMenu() }
      );
    } catch (error) {
      console.error('Error showing statistics:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async showSettings(userId) {
    try {
      await this.bot.sendMessage(
        userId,
        messages.admin.settingsMenu,
        { reply_markup: adminKeyboards.backToMainMenu() }
      );
    } catch (error) {
      console.error('Error showing settings:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async showMainMenu(userId) {
    await sessionService.updateSession(userId, BOT_TYPES.ADMIN, ADMIN_STATES.MAIN_MENU, {});

    await this.bot.sendMessage(
      userId,
      messages.common.backToMainMenu,
      { reply_markup: adminKeyboards.mainMenu() }
    );
  }

  getBot() {
    return this.bot;
  }
}

module.exports = AdminBot;
