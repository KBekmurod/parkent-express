const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

class BotConfig {
  constructor() {
    this.bot = null;
    this.isPolling = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
  }

  initialize() {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      logger.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    const options = {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10
        }
      },
      filepath: false
    };

    try {
      this.bot = new TelegramBot(token, options);
      this.isPolling = true;
      this.setupEventHandlers();
      
      logger.info('Telegram bot initialized successfully');
      
      return this.bot;
    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  setupEventHandlers() {
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram polling error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });

      if (error.code === 'EFATAL' || error.code === 'ETELEGRAM') {
        this.handleFatalError(error);
      }
    });

    this.bot.on('webhook_error', (error) => {
      logger.error('Telegram webhook error:', {
        error: error.message,
        stack: error.stack
      });
    });

    this.bot.on('error', (error) => {
      logger.error('Telegram bot error:', {
        error: error.message,
        stack: error.stack
      });
    });

    process.on('SIGINT', () => {
      this.stopPolling();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.stopPolling();
      process.exit(0);
    });
  }

  async handleFatalError(error) {
    logger.warn('Handling fatal Telegram error, attempting to reconnect...');

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Bot will not restart.');
      return;
    }

    this.reconnectAttempts++;
    
    try {
      await this.stopPolling();
      await this.sleep(this.reconnectDelay * this.reconnectAttempts);
      
      logger.info(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      this.bot.startPolling();
      this.isPolling = true;
      this.reconnectAttempts = 0;
      
      logger.info('Telegram bot reconnected successfully');
    } catch (reconnectError) {
      logger.error('Failed to reconnect bot:', {
        error: reconnectError.message,
        attempt: this.reconnectAttempts
      });
      
      this.handleFatalError(reconnectError);
    }
  }

  async stopPolling() {
    if (this.bot && this.isPolling) {
      try {
        await this.bot.stopPolling();
        this.isPolling = false;
        logger.info('Telegram bot polling stopped');
      } catch (error) {
        logger.error('Error stopping bot polling:', {
          error: error.message
        });
      }
    }
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      const defaultOptions = {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      };

      const message = await this.bot.sendMessage(chatId, text, defaultOptions);
      
      logger.debug('Message sent successfully', {
        chatId,
        messageId: message.message_id
      });

      return message;
    } catch (error) {
      logger.error('Failed to send message:', {
        chatId,
        error: error.message,
        code: error.code
      });
      throw error;
    }
  }

  async sendPhoto(chatId, photo, options = {}) {
    try {
      const message = await this.bot.sendPhoto(chatId, photo, options);
      
      logger.debug('Photo sent successfully', {
        chatId,
        messageId: message.message_id
      });

      return message;
    } catch (error) {
      logger.error('Failed to send photo:', {
        chatId,
        error: error.message
      });
      throw error;
    }
  }

  async sendLocation(chatId, latitude, longitude, options = {}) {
    try {
      const message = await this.bot.sendLocation(chatId, latitude, longitude, options);
      
      logger.debug('Location sent successfully', {
        chatId,
        messageId: message.message_id
      });

      return message;
    } catch (error) {
      logger.error('Failed to send location:', {
        chatId,
        error: error.message
      });
      throw error;
    }
  }

  async editMessageText(text, options = {}) {
    try {
      const message = await this.bot.editMessageText(text, options);
      
      logger.debug('Message edited successfully', {
        chatId: options.chat_id,
        messageId: options.message_id
      });

      return message;
    } catch (error) {
      if (error.message.includes('message is not modified')) {
        logger.debug('Message content unchanged, skipping edit');
        return null;
      }

      logger.error('Failed to edit message:', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  async deleteMessage(chatId, messageId) {
    try {
      await this.bot.deleteMessage(chatId, messageId);
      
      logger.debug('Message deleted successfully', {
        chatId,
        messageId
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete message:', {
        chatId,
        messageId,
        error: error.message
      });
      return false;
    }
  }

  async answerCallbackQuery(callbackQueryId, options = {}) {
    try {
      await this.bot.answerCallbackQuery(callbackQueryId, options);
      
      logger.debug('Callback query answered', {
        callbackQueryId
      });

      return true;
    } catch (error) {
      logger.error('Failed to answer callback query:', {
        callbackQueryId,
        error: error.message
      });
      return false;
    }
  }

  async getMe() {
    try {
      const botInfo = await this.bot.getMe();
      
      logger.info('Bot info retrieved', {
        id: botInfo.id,
        username: botInfo.username,
        firstName: botInfo.first_name
      });

      return botInfo;
    } catch (error) {
      logger.error('Failed to get bot info:', {
        error: error.message
      });
      throw error;
    }
  }

  async setWebhook(url, options = {}) {
    try {
      await this.stopPolling();
      
      const result = await this.bot.setWebhook(url, options);
      
      logger.info('Webhook set successfully', {
        url
      });

      return result;
    } catch (error) {
      logger.error('Failed to set webhook:', {
        url,
        error: error.message
      });
      throw error;
    }
  }

  async deleteWebhook() {
    try {
      const result = await this.bot.deleteWebhook();
      
      logger.info('Webhook deleted successfully');

      return result;
    } catch (error) {
      logger.error('Failed to delete webhook:', {
        error: error.message
      });
      throw error;
    }
  }

  getBot() {
    if (!this.bot) {
      throw new Error('Bot is not initialized. Call initialize() first.');
    }
    return this.bot;
  }

  isInitialized() {
    return this.bot !== null;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const botConfig = new BotConfig();

module.exports = botConfig;
