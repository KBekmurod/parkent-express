const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { UnauthorizedError, ValidationError } = require('../../utils/errorTypes');
const { JWT } = require('../../config/constants');
const logger = require('../../utils/logger');

class AuthController {
  async login(req, res, next) {
    try {
      const { telegramId, username, firstName, lastName } = req.body;

      if (!telegramId) {
        throw new ValidationError('Telegram ID is required');
      }

      let user = await User.findOne({ telegramId });

      if (!user) {
        user = new User({
          telegramId,
          username,
          firstName: firstName || 'User',
          lastName,
          role: 'admin'
        });
        await user.save();
        logger.info('New admin user created', { telegramId, userId: user._id });
      }

      if (!user.isActive) {
        throw new UnauthorizedError('User account is deactivated');
      }

      const token = jwt.sign(
        {
          userId: user._id,
          telegramId: user.telegramId,
          role: user.role,
          username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: JWT.ACCESS_TOKEN_EXPIRY }
      );

      await user.updateLastActive();

      logger.info('User logged in successfully', { userId: user._id, telegramId });

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive
          }
        },
        message: 'Login successful'
      });
    } catch (error) {
      logger.error('Login error', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async verifyToken(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId)
        .populate('vendorId')
        .populate('courierId');

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('User account is deactivated');
      }

      logger.info('Token verified successfully', { userId });

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            phone: user.phone,
            vendorId: user.vendorId,
            courierId: user.courierId,
            lastActive: user.lastActive
          }
        },
        message: 'Token is valid'
      });
    } catch (error) {
      logger.error('Token verification error', { error: error.message, stack: error.stack });
      next(error);
    }
  }
}

module.exports = new AuthController();
