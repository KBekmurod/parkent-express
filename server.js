require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const CustomerBot = require('./bots/customer.bot');
const CourierBot = require('./bots/courier.bot');
const AdminBot = require('./bots/admin.bot');
const notificationService = require('./services/notificationService');
const sessionService = require('./services/sessionService');

/**
 * Main Server - Initializes all bots and services
 */

// Validate environment variables
const requiredEnvVars = [
  'CUSTOMER_BOT_TOKEN',
  'COURIER_BOT_TOKEN',
  'ADMIN_BOT_TOKEN',
  'MONGO_URI',
  'ADMIN_TELEGRAM_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease create a .env file based on .env.example');
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    bots: {
      customer: 'running',
      courier: 'running',
      admin: 'running'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Parkent Express - Telegram Delivery System',
    version: '1.0.0',
    status: 'operational'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize bots
    console.log('Initializing bots...');
    const customerBot = new CustomerBot(process.env.CUSTOMER_BOT_TOKEN);
    const courierBot = new CourierBot(process.env.COURIER_BOT_TOKEN);
    const adminBot = new AdminBot(process.env.ADMIN_BOT_TOKEN);

    // Initialize notification service with bot instances
    notificationService.initializeBots(
      customerBot.getBot(),
      courierBot.getBot(),
      adminBot.getBot()
    );

    // Start session cleanup interval (every 30 minutes)
    setInterval(async () => {
      console.log('Running session cleanup...');
      await sessionService.cleanupExpiredSessions();
    }, 30 * 60 * 1000);

    // Start Express server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🚀 PARKENT EXPRESS - TELEGRAM DELIVERY SYSTEM');
      console.log('='.repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Customer bot active`);
      console.log(`✅ Courier bot active`);
      console.log(`✅ Admin bot active`);
      console.log(`✅ MongoDB connected`);
      console.log('='.repeat(50));
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
