const User = require('../models/User');
const { normalizePhone } = require('../utils/validators');
const { paginate, buildPaginationResponse } = require('../utils/helpers');

class UserService {
  async getUserById(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.toSafeObject();
  }
  
  async getUserByTelegramId(telegramId) {
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.toSafeObject();
  }
  
  async getUserByPhone(phone) {
    const normalizedPhone = normalizePhone(phone);
    const user = await User.findByPhone(normalizedPhone);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.toSafeObject();
  }
  
  async updateUser(userId, updates) {
    const allowedUpdates = [
      'firstName',
      'lastName',
      'email',
      'language',
      'address',
      'notificationSettings'
    ];
    
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});
    
    if (updates.phone) {
      filteredUpdates.phone = normalizePhone(updates.phone);
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.toSafeObject();
  }
  
  async updateUserLocation(userId, longitude, latitude, address) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.address = {
      ...user.address,
      ...address,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    };
    
    await user.save();
    
    return user.toSafeObject();
  }
  
  async updateNotificationSettings(userId, settings) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.notificationSettings = {
      ...user.notificationSettings,
      ...settings
    };
    
    await user.save();
    
    return user.toSafeObject();
  }
  
  async deactivateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return { message: 'User deactivated successfully' };
  }
  
  async activateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: true } },
      { new: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.toSafeObject();
  }
  
  async listUsers(filters = {}, page = 1, limit = 10) {
    const { skip, limit: paginationLimit } = paginate(page, limit);
    
    const query = { isActive: true };
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.search) {
      query.$or = [
        { firstName: new RegExp(filters.search, 'i') },
        { lastName: new RegExp(filters.search, 'i') },
        { phone: new RegExp(filters.search, 'i') },
        { email: new RegExp(filters.search, 'i') }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(paginationLimit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);
    
    return buildPaginationResponse(users, total, page, paginationLimit);
  }
  
  async getUserStats(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const Order = require('../models/Order');
    
    const orderStats = await Order.aggregate([
      { $match: { customer: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalSpent: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$pricing.total', 0] }
          }
        }
      }
    ]);
    
    return {
      user: user.toSafeObject(),
      stats: orderStats[0] || {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalSpent: 0
      }
    };
  }
}

module.exports = new UserService();
