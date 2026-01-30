/**
 * Tests for sessionManager middleware
 * Testing session creation for new users during registration
 */

const sessionManager = require('../bot/middleware/sessionManager');
const User = require('../models/User');
const Session = require('../models/Session');

// Mock the models
jest.mock('../models/User');
jest.mock('../models/Session');

describe('SessionManager - New User Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setSession for non-existent users', () => {
    test('should allow session creation for registration when user does not exist', async () => {
      const telegramId = '123456789';
      const mockUser = {
        _id: 'user123',
        telegramId: telegramId,
        firstName: 'Test',
        username: 'testuser',
        role: 'customer'
      };

      // Mock User.findByTelegramId to return null (user doesn't exist)
      User.findByTelegramId.mockResolvedValue(null);
      
      // Mock User.findOne to return null
      User.findOne.mockResolvedValue(null);
      
      // Mock User.create to return new user
      User.create.mockResolvedValue(mockUser);
      
      // Mock Session.createSession
      const mockSession = { _id: 'session123', sessionType: 'registration' };
      Session.createSession = jest.fn().mockResolvedValue(mockSession);

      // Should NOT throw error for registration sessions
      const result = await sessionManager.setSession(
        telegramId,
        'registration',
        { firstName: 'Test', username: 'testuser' }
      );

      expect(result).toBeDefined();
      expect(Session.createSession).toHaveBeenCalled();
    });

    test('should create user with default values when not found during registration', async () => {
      const telegramId = '987654321';
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };

      // Mock User.findByTelegramId to return null
      User.findByTelegramId.mockResolvedValue(null);
      User.findOne.mockResolvedValue(null);
      
      // Mock User.create
      const mockUser = {
        _id: 'user456',
        telegramId: telegramId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        role: 'customer',
        phone: `temp_${telegramId}`
      };
      User.create.mockResolvedValue(mockUser);
      
      // Mock Session.createSession
      Session.createSession = jest.fn().mockResolvedValue({ _id: 'session456' });

      const result = await sessionManager.setSession(
        telegramId,
        'registration',
        userData
      );

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramId: telegramId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          role: 'customer',
          phone: `temp_${telegramId}`
        })
      );
    });

    test('should use existing user if found', async () => {
      const telegramId = '111222333';
      const mockUser = {
        _id: 'existingUser',
        telegramId: telegramId,
        firstName: 'Existing',
        role: 'customer',
        phone: '+998901234567'
      };

      // Mock User.findByTelegramId to return existing user
      User.findByTelegramId.mockResolvedValue(mockUser);
      
      // Mock Session.createSession
      Session.createSession = jest.fn().mockResolvedValue({ _id: 'session789' });

      const result = await sessionManager.setSession(
        telegramId,
        'order_creation',
        {}
      );

      expect(User.create).not.toHaveBeenCalled();
      expect(Session.createSession).toHaveBeenCalledWith(
        mockUser._id,
        telegramId,
        'order_creation',
        {},
        30
      );
    });
  });
});
