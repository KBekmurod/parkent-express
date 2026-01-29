const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  phone: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['customer', 'courier', 'admin'],
    default: 'customer'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional fields for courier statistics
  totalDeliveries: {
    type: Number,
    default: 0
  },
  todayDeliveries: {
    type: Number,
    default: 0
  },
  todayEarnings: {
    type: Number,
    default: 0
  },
  lastDeliveryReset: {
    type: Date,
    default: Date.now
  }
});

// Reset daily statistics at midnight
userSchema.methods.resetDailyStats = function() {
  const now = new Date();
  const lastReset = new Date(this.lastDeliveryReset);
  
  // Check if it's a new day
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    this.todayDeliveries = 0;
    this.todayEarnings = 0;
    this.lastDeliveryReset = now;
  }
};

module.exports = mongoose.model('User', userSchema);
