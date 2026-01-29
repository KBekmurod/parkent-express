const TelegramBot = require('node-telegram-bot-api');
const { createLogger } = require('../utils/logger');

const logger = createLogger('bot');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  logger.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

const botOptions = {
  polling: !webhookUrl,
  webHook: webhookUrl ? {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  } : false
};

let bot = null;
let isInitialized = false;

const initBot = async () => {
  if (isInitialized && bot) {
    logger.info('Bot already initialized');
    return bot;
  }

  try {
    if (!token) {
      throw new Error('Telegram bot token is not configured');
    }

    bot = new TelegramBot(token, botOptions);
    
    if (webhookUrl) {
      await bot.setWebHook(`${webhookUrl}/bot${token}`, {
        secret_token: webhookSecret
      });
      logger.info(`Webhook set to: ${webhookUrl}/bot${token}`);
    } else {
      logger.info('Bot started in polling mode');
    }
    
    bot.on('polling_error', (error) => {
      logger.error('Polling error:', error);
    });
    
    bot.on('webhook_error', (error) => {
      logger.error('Webhook error:', error);
    });
    
    const botInfo = await bot.getMe();
    logger.info(`Bot initialized: @${botInfo.username}`);
    
    isInitialized = true;
    
    return bot;
    
  } catch (error) {
    logger.error('Error initializing bot:', error);
    isInitialized = false;
    throw error;
  }
};

const getBot = () => {
  if (!bot || !isInitialized) {
    throw new Error('Bot is not initialized. Call initBot() first.');
  }
  return bot;
};

const stopBot = async () => {
  if (!bot) {
    return;
  }
  
  try {
    if (webhookUrl) {
      await bot.deleteWebHook();
      logger.info('Webhook deleted');
    } else {
      await bot.stopPolling();
      logger.info('Polling stopped');
    }
    
    isInitialized = false;
    bot = null;
    
  } catch (error) {
    logger.error('Error stopping bot:', error);
    throw error;
  }
};

const getBotStatus = () => {
  return {
    isInitialized,
    mode: webhookUrl ? 'webhook' : 'polling',
    webhookUrl: webhookUrl || null
  };
};

module.exports = {
  initBot,
  getBot,
  stopBot,
  getBotStatus,
  token
};
