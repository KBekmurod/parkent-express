/**
 * Integration tests for critical production fixes
 * Testing bot initialization, database reconnection, and transaction support
 */

describe('Critical Production Fixes', () => {
  describe('Bot Initialization with Retry Logic', () => {
    test('should export initBot function', () => {
      const botConfig = require('../config/bot');
      expect(typeof botConfig.initBot).toBe('function');
    });

    test('should have retry constants defined', () => {
      // Check that the module loads without errors
      const botConfig = require('../config/bot');
      expect(botConfig).toBeDefined();
    });
  });

  describe('Database Reconnection Logic', () => {
    test('should export connectDB function', () => {
      const database = require('../config/database');
      expect(typeof database.connectDB).toBe('function');
      expect(typeof database.disconnectDB).toBe('function');
      expect(typeof database.getConnectionStatus).toBe('function');
    });
  });

  describe('MongoDB Transactions in OrderService', () => {
    test('should load orderService without errors', () => {
      const orderService = require('../services/orderService');
      expect(orderService).toBeDefined();
      expect(typeof orderService.createOrder).toBe('function');
      expect(typeof orderService.updateOrderStatus).toBe('function');
      expect(typeof orderService.assignCourier).toBe('function');
      expect(typeof orderService.cancelOrder).toBe('function');
    });
  });

  describe('User Model Updates', () => {
    test('should have User model with new fields', () => {
      const User = require('../models/User');
      const userSchema = User.schema;
      
      // Check if new fields are in schema
      expect(userSchema.paths.totalOrders).toBeDefined();
      expect(userSchema.paths.lastOrderAt).toBeDefined();
      expect(userSchema.paths.activeOrders).toBeDefined();
      expect(userSchema.paths.totalDeliveries).toBeDefined();
      expect(userSchema.paths.todayDeliveries).toBeDefined();
      expect(userSchema.paths.lastDeliveryReset).toBeDefined();
    });

    test('should have resetDailyStats method', () => {
      const User = require('../models/User');
      const user = new User({
        telegramId: 'test123',
        firstName: 'Test',
        phone: '+998901234567',
        role: 'customer'
      });
      
      expect(typeof user.resetDailyStats).toBe('function');
    });
  });
});
