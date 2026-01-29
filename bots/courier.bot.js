const TelegramBot = require('node-telegram-bot-api');
const sessionService = require('../services/sessionService');
const orderService = require('../services/orderService');
const notificationService = require('../services/notificationService');
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimit');
const { courierKeyboards } = require('../utils/keyboard');
const messages = require('../utils/messages');
const { COURIER_STATES, BOT_TYPES, ORDER_STATUS } = require('../config/constants');

/**
 * Courier Bot - Handles courier operations
 */
class CourierBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
    console.log('Courier bot started');
  }

  setupHandlers() {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // Handle callback queries
    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Courier bot polling error:', error);
    });
  }

  async handleStart(msg) {
    const userId = msg.from.id;

    try {
      // Check rate limit
      const rateCheck = await rateLimitMiddleware.checkRateLimit(userId);
      if (!rateCheck.allowed) {
        await this.bot.sendMessage(userId, messages.courier.rateLimitExceeded(rateCheck.retryAfter));
        return;
      }

      // Check if user is courier
      const isCourier = await authMiddleware.isCourier(userId);
      if (!isCourier) {
        await this.bot.sendMessage(userId, messages.courier.notAuthorized);
        return;
      }

      // Reset session
      await sessionService.createSession(userId, BOT_TYPES.COURIER, COURIER_STATES.MAIN_MENU);

      // Send welcome message
      await this.bot.sendMessage(
        userId,
        messages.courier.welcome,
        { reply_markup: courierKeyboards.mainMenu() }
      );
    } catch (error) {
      console.error('Error in handleStart:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async handleCallbackQuery(query) {
    const userId = query.from.id;
    const data = query.data;

    try {
      // Check rate limit
      const rateCheck = await rateLimitMiddleware.checkRateLimit(userId);
      if (!rateCheck.allowed) {
        await this.bot.answerCallbackQuery(query.id, { 
          text: messages.courier.rateLimitExceeded(rateCheck.retryAfter),
          show_alert: true 
        });
        return;
      }

      // Check if user is courier
      const isCourier = await authMiddleware.isCourier(userId);
      if (!isCourier) {
        await this.bot.answerCallbackQuery(query.id, { 
          text: messages.courier.notAuthorized,
          show_alert: true 
        });
        return;
      }

      // Handle callback
      if (data === 'view_orders') {
        await this.showOrders(userId);
      } else if (data === 'my_stats') {
        await this.showStatistics(userId);
      } else if (data === 'main_menu') {
        await this.showMainMenu(userId);
      } else if (data === 'skip_order') {
        await this.showMainMenu(userId);
      } else if (data.startsWith('accept_')) {
        const orderId = data.replace('accept_', '');
        await this.acceptOrder(userId, orderId);
      } else if (data.startsWith('on_way_')) {
        const orderId = data.replace('on_way_', '');
        await this.markOnTheWay(userId, orderId);
      } else if (data.startsWith('delivered_')) {
        const orderId = data.replace('delivered_', '');
        await this.markDelivered(userId, orderId);
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
      // First check if courier has active orders
      const activeOrders = await orderService.getCourierActiveOrders(userId);
      
      if (activeOrders.length > 0) {
        // Show active order
        const order = activeOrders[0];
        const messageText = messages.courier.orderDetails(order);

        // Send order details
        await this.bot.sendMessage(
          userId,
          messageText,
          { reply_markup: courierKeyboards.deliveryActions(order._id) }
        );

        // Send location
        await this.bot.sendLocation(
          userId,
          order.location.latitude,
          order.location.longitude
        );
        return;
      }

      // If no active orders, show pending orders
      const pendingOrders = await orderService.getPendingOrders();

      if (pendingOrders.length === 0) {
        await this.bot.sendMessage(
          userId,
          messages.courier.noOrders,
          { reply_markup: courierKeyboards.backToMainMenu() }
        );
        return;
      }

      // Show first pending order
      const order = pendingOrders[0];
      const messageText = messages.courier.orderDetails(order);

      await this.bot.sendMessage(
        userId,
        messageText,
        { reply_markup: courierKeyboards.orderActions(order._id) }
      );

      // Send location
      await this.bot.sendLocation(
        userId,
        order.location.latitude,
        order.location.longitude
      );
    } catch (error) {
      console.error('Error showing orders:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async acceptOrder(userId, orderId) {
    try {
      const order = await orderService.acceptOrder(orderId, userId);

      await this.bot.sendMessage(
        userId,
        messages.courier.orderAccepted,
        { reply_markup: courierKeyboards.deliveryActions(order._id) }
      );

      // Notify customer
      await notificationService.notifyCustomer(
        order.customerId,
        '✅ Kurer buyurtmangizni qabul qildi! Tez orada yetkaziladi.'
      );
    } catch (error) {
      console.error('Error accepting order:', error);
      if (error.message === 'ORDER_NOT_AVAILABLE') {
        await this.bot.sendMessage(userId, messages.courier.orderAlreadyTaken);
      } else {
        await this.bot.sendMessage(userId, messages.customer.errorOccurred);
      }
    }
  }

  async markOnTheWay(userId, orderId) {
    try {
      const order = await orderService.updateOrderStatus(orderId, ORDER_STATUS.DELIVERING, userId);

      if (!order) {
        await this.bot.sendMessage(userId, messages.customer.errorOccurred);
        return;
      }

      await this.bot.sendMessage(
        userId,
        messages.courier.onTheWay,
        { reply_markup: courierKeyboards.deliveryActions(order._id) }
      );

      // Notify customer
      await notificationService.notifyCustomer(
        order.customerId,
        '🚴 Kurer yo\'lda! Tez orada buyurtmangiz yetkaziladi.'
      );
    } catch (error) {
      console.error('Error marking on the way:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async markDelivered(userId, orderId) {
    try {
      const order = await orderService.updateOrderStatus(orderId, ORDER_STATUS.DELIVERED, userId);

      if (!order) {
        await this.bot.sendMessage(userId, messages.customer.errorOccurred);
        return;
      }

      await this.bot.sendMessage(
        userId,
        messages.courier.deliveryConfirmed,
        { reply_markup: courierKeyboards.mainMenu() }
      );

      // Notify customer
      await notificationService.notifyCustomer(
        order.customerId,
        messages.customer.orderDelivered
      );

      // Notify admin
      const courier = await authMiddleware.getUser(userId);
      await notificationService.notifyAdminDeliveryComplete(order, courier);
    } catch (error) {
      console.error('Error marking delivered:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async showStatistics(userId) {
    try {
      const user = await authMiddleware.getUser(userId);
      
      if (!user) {
        await this.bot.sendMessage(userId, messages.customer.errorOccurred);
        return;
      }

      // Reset daily stats if needed
      user.resetDailyStats();
      await user.save();

      const stats = {
        todayDeliveries: user.todayDeliveries || 0,
        todayEarnings: user.todayEarnings || 0,
        totalDeliveries: user.totalDeliveries || 0
      };

      await this.bot.sendMessage(
        userId,
        messages.courier.statistics(stats),
        { reply_markup: courierKeyboards.backToMainMenu() }
      );
    } catch (error) {
      console.error('Error showing statistics:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async showMainMenu(userId) {
    await sessionService.updateSession(userId, BOT_TYPES.COURIER, COURIER_STATES.MAIN_MENU, {});

    await this.bot.sendMessage(
      userId,
      messages.common.backToMainMenu,
      { reply_markup: courierKeyboards.mainMenu() }
    );
  }

  getBot() {
    return this.bot;
  }
}

module.exports = CourierBot;
