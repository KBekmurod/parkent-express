const User = require('../models/User');
const { ROLES } = require('../config/constants');

/**
 * Authentication middleware for bots
 */
class AuthMiddleware {
  /**
   * Check if user is admin
   */
  async isAdmin(telegramId) {
    try {
      const adminId = process.env.ADMIN_TELEGRAM_ID;
      
      if (!adminId) {
        console.error('ADMIN_TELEGRAM_ID not set in environment variables');
        return false;
      }

      // Check if telegram ID matches admin ID
      if (telegramId.toString() === adminId.toString()) {
        // Ensure user exists in database
        await this.ensureUserExists(telegramId, ROLES.ADMIN);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Check if user is registered courier
   */
  async isCourier(telegramId) {
    try {
      const user = await User.findOne({ 
        telegramId, 
        role: ROLES.COURIER,
        isActive: true
      });
      
      return !!user;
    } catch (error) {
      console.error('Error checking courier status:', error);
      return false;
    }
  }

  /**
   * Ensure user exists in database
   */
  async ensureUserExists(telegramId, role = ROLES.CUSTOMER) {
    try {
      let user = await User.findOne({ telegramId });
      
      if (!user) {
        user = new User({
          telegramId,
          role,
          registeredAt: new Date(),
          isActive: true
        });
        await user.save();
        console.log(`New user created: ${telegramId} as ${role}`);
      } else if (user.role !== role && role === ROLES.ADMIN) {
        // Update role to admin if needed
        user.role = role;
        await user.save();
      }
      
      return user;
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  }

  /**
   * Get user by telegram ID
   */
  async getUser(telegramId) {
    try {
      return await User.findOne({ telegramId });
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Update user phone
   */
  async updateUserPhone(telegramId, phone) {
    try {
      const user = await User.findOneAndUpdate(
        { telegramId },
        { phone },
        { new: true }
      );
      return user;
    } catch (error) {
      console.error('Error updating user phone:', error);
      throw error;
    }
  }

  /**
   * Register new courier
   */
  async registerCourier(telegramId) {
    try {
      let user = await User.findOne({ telegramId });
      
      if (!user) {
        user = new User({
          telegramId,
          role: ROLES.COURIER,
          isActive: true
        });
      } else {
        user.role = ROLES.COURIER;
        user.isActive = true;
      }
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Error registering courier:', error);
      throw error;
    }
  }

  /**
   * Remove courier
   */
  async removeCourier(telegramId) {
    try {
      const user = await User.findOneAndUpdate(
        { telegramId, role: ROLES.COURIER },
        { isActive: false },
        { new: true }
      );
      return user;
    } catch (error) {
      console.error('Error removing courier:', error);
      throw error;
    }
  }

  /**
   * Get all active couriers
   */
  async getAllCouriers() {
    try {
      return await User.find({ 
        role: ROLES.COURIER, 
        isActive: true 
      });
    } catch (error) {
      console.error('Error getting couriers:', error);
      return [];
    }
  }
}

module.exports = new AuthMiddleware();
