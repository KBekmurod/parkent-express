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

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds base delay

const initBotWithRetry = async (retryCount = 0) => {
  try {
    logger.info('Initializing Telegram Bot...');
    
    if (!token) {
      throw new Error('Telegram bot token is not configured. Check your .env file');
    }

    bot = botModule.initializeBot();
    
    if (!bot) {
      throw new Error('Failed to initialize bot');
    }
    
    // Verify bot is working by getting bot info
    const botInfo = await bot.getMe();
    logger.info(`✅ Telegram Bot initialized: @${botInfo.username}`);
    
    isInitialized = true;
    return bot;
    
  } catch (error) {
    logger.error('❌ Failed to initialize Telegram Bot:', error.message);
    
    // Check for invalid token error
    if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      throw new Error('Invalid bot token. Check your .env file');
    }
    
    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      logger.info(`Retrying Telegram Bot initialization in ${delay/1000}s... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return initBotWithRetry(retryCount + 1);
    }
    
    throw new Error(`Failed to initialize Telegram Bot after ${MAX_RETRIES} attempts`);
  }
};

const initBot = async () => {
  if (isInitialized && bot) {
    logger.info('Bot already initialized');
    return bot;
  }

  try {
    return await initBotWithRetry();
  } catch (error) {
    logger.error('❌ Bot initialization failed:', error.message);
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
