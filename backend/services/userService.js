const User = require('../models/User');
const logger = require('../utils/logger');
const { 
  NotFoundError, 
  ValidationError, 
  ConflictError,
  DuplicateError 
} = require('../utils/errorTypes');

class UserService {
  async createUser(userData) {
    try {
      logger.info('Creating new user', { telegramId: userData.telegramId });

      const existingUser = await User.findByTelegramId(userData.telegramId);
      if (existingUser) {
        throw new DuplicateError('User with this Telegram ID already exists', 'telegramId');
      }

      const user = new User(userData);
      await user.save();

      logger.info('User created successfully', { userId: user._id, telegramId: user.telegramId });
      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new DuplicateError('User with this Telegram ID already exists', 'telegramId');
      }
      logger.error('Error creating user', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId)
        .populate('vendorId')
        .populate('courierId');

      if (!user) {
        throw new NotFoundError('User not found', 'User');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting user by ID', { userId, error: error.message });
      throw error;
    }
  }

  async getUserByTelegramId(telegramId) {
    try {
      const user = await User.findByTelegramId(telegramId)
        .populate('vendorId')
        .populate('courierId');

      if (!user) {
        throw new NotFoundError('User not found', 'User');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting user by Telegram ID', { telegramId, error: error.message });
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      logger.info('Updating user', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'User');
      }

      const allowedFields = [
        'username', 'firstName', 'lastName', 'phone', 
        'isActive', 'defaultLocation', 'lastActive'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          user[field] = updateData[field];
        }
      });

      await user.save();

      logger.info('User updated successfully', { userId: user._id });
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating user', { userId, error: error.message });
      throw error;
    }
  }

  async updateUserRole(userId, newRole, additionalData = {}) {
    try {
      logger.info('Updating user role', { userId, newRole });

      const validRoles = ['customer', 'vendor', 'courier', 'admin'];
      if (!validRoles.includes(newRole)) {
        throw new ValidationError(`Invalid role: ${newRole}`);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'User');
      }

      user.role = newRole;

      if (newRole === 'vendor' && additionalData.vendorId) {
        user.vendorId = additionalData.vendorId;
      }

      if (newRole === 'courier' && additionalData.courierId) {
        user.courierId = additionalData.courierId;
      }

      await user.save();

      logger.info('User role updated successfully', { userId, newRole });
      return user;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Error updating user role', { userId, newRole, error: error.message });
      throw error;
    }
  }

  async deactivateUser(userId) {
    try {
      logger.info('Deactivating user', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'User');
      }

      user.isActive = false;
      await user.save();

      logger.info('User deactivated successfully', { userId });
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deactivating user', { userId, error: error.message });
      throw error;
    }
  }

  async activateUser(userId) {
    try {
      logger.info('Activating user', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'User');
      }

      user.isActive = true;
      await user.save();

      logger.info('User activated successfully', { userId });
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error activating user', { userId, error: error.message });
      throw error;
    }
  }

  async getUsersByRole(role, options = {}) {
    try {
      const { isActive = true, page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const query = { role };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const users = await User.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      logger.info('Retrieved users by role', { role, count: users.length });

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting users by role', { role, error: error.message });
      throw error;
    }
  }

  async searchUsers(searchQuery, options = {}) {
    try {
      const { page = 1, limit = 20, role } = options;
      const skip = (page - 1) * limit;

      const query = {
        $or: [
          { firstName: { $regex: searchQuery, $options: 'i' } },
          { lastName: { $regex: searchQuery, $options: 'i' } },
          { username: { $regex: searchQuery, $options: 'i' } },
          { phone: { $regex: searchQuery, $options: 'i' } }
        ]
      };

      if (role) {
        query.role = role;
      }

      const users = await User.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      logger.info('Searched users', { query: searchQuery, count: users.length });

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching users', { searchQuery, error: error.message });
      throw error;
    }
  }

  async updateLastActive(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'User');
      }

      await user.updateLastActive();
      return user;
    } catch (error) {
      logger.error('Error updating last active', { userId, error: error.message });
      throw error;
    }
  }

  async getUserStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            }
          }
        }
      ]);

      const total = await User.countDocuments();
      const activeTotal = await User.countDocuments({ isActive: true });

      logger.info('Retrieved user stats');

      return {
        total,
        activeTotal,
        byRole: stats
      };
    } catch (error) {
      logger.error('Error getting user stats', { error: error.message });
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      logger.info('Deleting user', { userId });

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'User');
      }

      logger.info('User deleted successfully', { userId });
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deleting user', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = new UserService();
