const { createLogger } = require('../utils/logger');
const botModule = require('../bot');

const logger = createLogger('bot');

const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

if (!token) {
  logger.error('BOT_TOKEN is not defined in environment variables');
}

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

    bot = botModule.initializeBot();
    
    if (!bot) {
      throw new Error('Failed to initialize bot');
    }
    
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
    return botModule.getBot();
  }
  return bot;
};

const stopBot = async () => {
  if (!bot) {
    return;
  }
  
  try {
    await bot.stopPolling();
    logger.info('Bot polling stopped');
    
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
