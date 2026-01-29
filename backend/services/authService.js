const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { normalizePhone } = require('../utils/validators');

class AuthService {
  async registerUser(userData) {
    const { telegramId, phone, firstName, lastName, role = 'customer' } = userData;
    
    const normalizedPhone = normalizePhone(phone);
    
    const existingUser = await User.findOne({
      $or: [
        { telegramId },
        { phone: normalizedPhone }
      ]
    });
    
    if (existingUser) {
      if (existingUser.telegramId === telegramId) {
        throw new Error('User with this Telegram ID already exists');
      }
      throw new Error('User with this phone number already exists');
    }
    
    const user = new User({
      telegramId,
      phone: normalizedPhone,
      firstName,
      lastName,
      role,
      isVerified: true,
      metadata: {
        registrationSource: 'telegram',
        lastLogin: new Date()
      }
    });
    
    await user.save();
    
    const token = this.generateToken(user._id, user.role);
    const refreshToken = this.generateRefreshToken(user._id);
    
    return {
      user: user.toSafeObject(),
      token,
      refreshToken
    };
  }
  
  async loginWithTelegram(telegramId) {
    const user = await User.findOne({ telegramId, isActive: true });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.metadata.lastLogin = new Date();
    await user.save();
    
    const token = this.generateToken(user._id, user.role);
    const refreshToken = this.generateRefreshToken(user._id);
    
    return {
      user: user.toSafeObject(),
      token,
      refreshToken
    };
  }
  
  async loginWithPhone(phone, password) {
    const normalizedPhone = normalizePhone(phone);
    
    const user = await User.findOne({ 
      phone: normalizedPhone,
      isActive: true 
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    if (!user.password) {
      throw new Error('Password not set. Please use Telegram login');
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    user.metadata.lastLogin = new Date();
    await user.save();
    
    const token = this.generateToken(user._id, user.role);
    const refreshToken = this.generateRefreshToken(user._id);
    
    return {
      user: user.toSafeObject(),
      token,
      refreshToken
    };
  }
  
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }
      
      const newToken = this.generateToken(user._id, user.role);
      const newRefreshToken = this.generateRefreshToken(user._id);
      
      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
      
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
  
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return null;
      }
      
      return user.toSafeObject();
      
    } catch (error) {
      return null;
    }
  }
  
  generateToken(userId, role) {
    return jwt.sign(
      { 
        userId: userId.toString(),
        role 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }
  
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId: userId.toString() },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }
  
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.password) {
      const isPasswordValid = await user.comparePassword(oldPassword);
      
      if (!isPasswordValid) {
        throw new Error('Invalid old password');
      }
    }
    
    user.password = newPassword;
    await user.save();
    
    return { message: 'Password changed successfully' };
  }
  
  async resetPassword(phone, newPassword) {
    const normalizedPhone = normalizePhone(phone);
    
    const user = await User.findOne({ phone: normalizedPhone, isActive: true });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.password = newPassword;
    await user.save();
    
    return { message: 'Password reset successfully' };
  }
}

module.exports = new AuthService();
