const TelegramBot = require('node-telegram-bot-api');
const sessionService = require('../services/sessionService');
const orderService = require('../services/orderService');
const notificationService = require('../services/notificationService');
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimit');
const { customerKeyboards } = require('../utils/keyboard');
const messages = require('../utils/messages');
const { CUSTOMER_STATES, BOT_TYPES, PARKENT_BOUNDARIES } = require('../config/constants');

/**
 * Customer Bot - Handles customer orders
 */
class CustomerBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
    console.log('Customer bot started');
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
      console.error('Customer bot polling error:', error);
    });
  }

  async handleStart(msg) {
    const userId = msg.from.id;

    try {
      // Check rate limit
      const rateCheck = await rateLimitMiddleware.checkRateLimit(userId);
      if (!rateCheck.allowed) {
        await this.bot.sendMessage(userId, messages.customer.rateLimitExceeded(rateCheck.retryAfter));
        return;
      }

      // Ensure user exists
      await authMiddleware.ensureUserExists(userId);

      // Reset session
      await sessionService.createSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.MAIN_MENU);

      // Send welcome message
      await this.bot.sendMessage(
        userId,
        messages.customer.welcome,
        { reply_markup: customerKeyboards.mainMenu() }
      );
    } catch (error) {
      console.error('Error in handleStart:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async handleMessage(msg) {
    const userId = msg.from.id;

    try {
      // Check rate limit
      const rateCheck = await rateLimitMiddleware.checkRateLimit(userId);
      if (!rateCheck.allowed) {
        await this.bot.sendMessage(userId, messages.customer.rateLimitExceeded(rateCheck.retryAfter));
        return;
      }

      // Get session
      const session = await sessionService.getSession(userId, BOT_TYPES.CUSTOMER);

      // Handle based on state
      switch (session.state) {
        case CUSTOMER_STATES.AWAITING_PHONE:
          await this.handlePhoneInput(msg, session);
          break;
        case CUSTOMER_STATES.AWAITING_LOCATION:
          await this.handleLocationInput(msg, session);
          break;
        case CUSTOMER_STATES.AWAITING_ORDER_DETAILS:
          await this.handleOrderDetailsInput(msg, session);
          break;
        default:
          // Unknown state, reset to main menu
          await this.bot.sendMessage(
            userId,
            messages.customer.welcome,
            { reply_markup: customerKeyboards.mainMenu() }
          );
      }
    } catch (error) {
      console.error('Error in handleMessage:', error);
      await this.bot.sendMessage(userId, messages.customer.errorOccurred);
    }
  }

  async handlePhoneInput(msg, session) {
    const userId = msg.from.id;
    let phone = '';

    // Check if it's a contact
    if (msg.contact) {
      phone = msg.contact.phone_number;
    } else if (msg.text) {
      // Validate phone format
      phone = msg.text.replace(/\D/g, '');
      if (phone.length < 9 || phone.length > 13) {
        await this.bot.sendMessage(
          userId,
          '❌ Noto\'g\'ri telefon raqam formati. Iltimos, qayta kiriting.',
          { reply_markup: customerKeyboards.requestPhone() }
        );
        return;
      }
    }

    // Update user phone
    await authMiddleware.updateUserPhone(userId, phone);

    // Update session
    session.data.phone = phone;
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.AWAITING_LOCATION, session.data);

    // Request location
    await this.bot.sendMessage(
      userId,
      messages.customer.phoneReceived + '\n\n' + messages.customer.requestLocation,
      { reply_markup: customerKeyboards.requestLocation() }
    );
  }

  async handleLocationInput(msg, session) {
    const userId = msg.from.id;

    if (!msg.location) {
      await this.bot.sendMessage(
        userId,
        messages.customer.requestLocation,
        { reply_markup: customerKeyboards.requestLocation() }
      );
      return;
    }

    const { latitude, longitude } = msg.location;

    // Basic validation for Parkent district
    if (latitude < PARKENT_BOUNDARIES.MIN_LAT || latitude > PARKENT_BOUNDARIES.MAX_LAT ||
        longitude < PARKENT_BOUNDARIES.MIN_LON || longitude > PARKENT_BOUNDARIES.MAX_LON) {
      await this.bot.sendMessage(
        userId,
        messages.customer.invalidLocation,
        { reply_markup: customerKeyboards.requestLocation() }
      );
      return;
    }

    // Update session
    session.data.location = {
      latitude,
      longitude,
      address: 'Lokatsiya yuborilgan'
    };
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.AWAITING_ORDER_DETAILS, session.data);

    // Request order details
    await this.bot.sendMessage(
      userId,
      messages.customer.locationReceived + '\n\n' + messages.customer.requestOrderDetails,
      { reply_markup: { remove_keyboard: true } }
    );
  }

  async handleOrderDetailsInput(msg, session) {
    const userId = msg.from.id;

    if (!msg.text || msg.text.length < 3) {
      await this.bot.sendMessage(userId, '❌ Buyurtma tafsilotlari juda qisqa. Iltimos, qayta kiriting.');
      return;
    }

    // Update session
    session.data.orderDetails = msg.text;
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.AWAITING_PAYMENT_TYPE, session.data);

    // Ask for payment type
    await this.bot.sendMessage(
      userId,
      messages.customer.orderDetailsReceived + '\n\n' + messages.customer.selectPaymentType,
      { reply_markup: customerKeyboards.paymentType() }
    );
  }

  async handleCallbackQuery(query) {
    const userId = query.from.id;
    const data = query.data;

    try {
      // Check rate limit
      const rateCheck = await rateLimitMiddleware.checkRateLimit(userId);
      if (!rateCheck.allowed) {
        await this.bot.answerCallbackQuery(query.id, { 
          text: messages.customer.rateLimitExceeded(rateCheck.retryAfter),
          show_alert: true 
        });
        return;
      }

      // Get session
      const session = await sessionService.getSession(userId, BOT_TYPES.CUSTOMER);

      // Handle callback
      switch (data) {
        case 'place_order':
          await this.startOrderPlacement(userId, session);
          break;
        case 'my_orders':
          await this.showMyOrders(userId);
          break;
        case 'help':
          await this.showHelp(userId);
          break;
        case 'payment_cash':
          await this.selectPaymentType(userId, session, 'cash');
          break;
        case 'payment_card':
          await this.selectPaymentType(userId, session, 'card');
          break;
        case 'confirm_order':
          await this.confirmOrder(userId, session);
          break;
        case 'edit_order':
          await this.showEditOptions(userId, session);
          break;
        case 'cancel_order':
          await this.cancelOrder(userId, session);
          break;
        case 'edit_location':
          await this.editLocation(userId, session);
          break;
        case 'edit_details':
          await this.editDetails(userId, session);
          break;
        case 'edit_payment':
          await this.editPayment(userId, session);
          break;
        case 'back_to_confirmation':
          await this.showConfirmation(userId, session);
          break;
        case 'main_menu':
          await this.showMainMenu(userId);
          break;
        case 'back':
          await this.handleBack(userId, session);
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

  async startOrderPlacement(userId, session) {
    // Check if user already has an active order
    const orders = await orderService.getCustomerOrders(userId);
    const activeOrder = orders.find(o => ['pending', 'accepted', 'delivering'].includes(o.status));
    
    if (activeOrder) {
      await this.bot.sendMessage(userId, messages.customer.activeOrderExists);
      return;
    }

    // Reset session data
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.AWAITING_PHONE, {});

    // Request phone
    await this.bot.sendMessage(
      userId,
      messages.customer.requestPhone,
      { reply_markup: customerKeyboards.requestPhone() }
    );
  }

  async showMyOrders(userId) {
    const orders = await orderService.getCustomerOrders(userId);

    if (orders.length === 0) {
      await this.bot.sendMessage(
        userId,
        messages.customer.myOrdersEmpty,
        { reply_markup: customerKeyboards.mainMenu() }
      );
      return;
    }

    let messageText = messages.customer.myOrdersList + '\n\n';
    orders.forEach((order, index) => {
      messageText += `${index + 1}. ${messages.customer.orderStatus(order)}\n`;
    });

    await this.bot.sendMessage(
      userId,
      messageText,
      { reply_markup: customerKeyboards.backAndMainMenu() }
    );
  }

  async showHelp(userId) {
    await this.bot.sendMessage(
      userId,
      messages.customer.helpMessage,
      { reply_markup: customerKeyboards.backAndMainMenu() }
    );
  }

  async selectPaymentType(userId, session, paymentType) {
    session.data.paymentType = paymentType;
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.CONFIRMATION, session.data);

    await this.showConfirmation(userId, session);
  }

  async showConfirmation(userId, session) {
    const orderData = session.data;
    
    const confirmationMessage = messages.customer.orderConfirmation({
      location: orderData.location,
      orderDetails: orderData.orderDetails,
      paymentType: orderData.paymentType,
      customerPhone: orderData.phone
    });

    await this.bot.sendMessage(
      userId,
      confirmationMessage,
      { reply_markup: customerKeyboards.confirmation() }
    );
  }

  async confirmOrder(userId, session) {
    try {
      const orderData = session.data;

      // Create order
      const order = await orderService.createOrder({
        customerId: userId,
        customerPhone: orderData.phone,
        location: orderData.location,
        orderDetails: orderData.orderDetails,
        paymentType: orderData.paymentType
      });

      // Notify admin
      await notificationService.notifyAdminNewOrder(order);

      // Reset session
      await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.MAIN_MENU, {});

      // Send confirmation
      await this.bot.sendMessage(
        userId,
        messages.customer.orderConfirmed,
        { reply_markup: customerKeyboards.mainMenu() }
      );
    } catch (error) {
      console.error('Error confirming order:', error);
      if (error.message === 'ACTIVE_ORDER_EXISTS') {
        await this.bot.sendMessage(userId, messages.customer.activeOrderExists);
      } else {
        await this.bot.sendMessage(userId, messages.customer.errorOccurred);
      }
    }
  }

  async showEditOptions(userId, session) {
    await this.bot.sendMessage(
      userId,
      messages.customer.selectEditOption,
      { reply_markup: customerKeyboards.editOptions() }
    );
  }

  async cancelOrder(userId, session) {
    // Reset session
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.MAIN_MENU, {});

    await this.bot.sendMessage(
      userId,
      messages.customer.orderCancelled,
      { reply_markup: customerKeyboards.mainMenu() }
    );
  }

  async editLocation(userId, session) {
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.AWAITING_LOCATION, session.data);

    await this.bot.sendMessage(
      userId,
      messages.customer.requestLocation,
      { reply_markup: customerKeyboards.requestLocation() }
    );
  }

  async editDetails(userId, session) {
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.AWAITING_ORDER_DETAILS, session.data);

    await this.bot.sendMessage(
      userId,
      messages.customer.requestOrderDetails,
      { reply_markup: { remove_keyboard: true } }
    );
  }

  async editPayment(userId, session) {
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.AWAITING_PAYMENT_TYPE, session.data);

    await this.bot.sendMessage(
      userId,
      messages.customer.selectPaymentType,
      { reply_markup: customerKeyboards.paymentType() }
    );
  }

  async showMainMenu(userId) {
    await sessionService.updateSession(userId, BOT_TYPES.CUSTOMER, CUSTOMER_STATES.MAIN_MENU, {});

    await this.bot.sendMessage(
      userId,
      messages.common.backToMainMenu,
      { reply_markup: customerKeyboards.mainMenu() }
    );
  }

  async handleBack(userId, session) {
    // Simplified back handling - return to main menu
    await this.showMainMenu(userId);
  }

  getBot() {
    return this.bot;
  }
}

module.exports = CustomerBot;
