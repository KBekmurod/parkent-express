const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    sparse: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'courier', 'admin'],
    default: 'customer',
    required: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true
  },
  password: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  address: {
    street: String,
    city: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  language: {
    type: String,
    enum: ['uz', 'ru', 'en'],
    default: 'uz'
  },
  notificationSettings: {
    orderUpdates: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: true
    },
    telegram: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    lastLogin: Date,
    lastActivity: Date,
    deviceInfo: String,
    registrationSource: {
      type: String,
      enum: ['telegram', 'web', 'admin'],
      default: 'telegram'
    }
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  lastOrderAt: {
    type: Date,
    default: null
  },
  activeOrders: {
    type: Number,
    default: 0
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  todayDeliveries: {
    type: Number,
    default: 0
  },
  lastDeliveryReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.index({ 'address.location': '2dsphere' });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getFullName = function() {
  return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
};

userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

userSchema.methods.resetDailyStats = function() {
  const now = new Date();
  const lastReset = this.lastDeliveryReset || new Date(0);
  
  // Check if we need to reset (new day)
  if (now.toDateString() !== lastReset.toDateString()) {
    this.todayDeliveries = 0;
    this.lastDeliveryReset = now;
  }
};

userSchema.virtual('fullName').get(function() {
  return this.getFullName();
});

userSchema.statics.findByTelegramId = function(telegramId) {
  return this.findOne({ telegramId, isActive: true });
};

userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
