const mongoose = require('mongoose');

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
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'courier', 'admin'],
    default: 'customer',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  defaultLocation: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    address: String
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  courierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Courier'
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.lastName 
    ? `${this.firstName} ${this.lastName}` 
    : this.firstName;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.username || this.fullName;
});

// Method to update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to check if user has a specific role
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

// Method to check if user can place orders
userSchema.methods.canPlaceOrder = function() {
  return this.isActive && ['customer', 'admin'].includes(this.role);
};

// Static method to find by telegram ID
userSchema.statics.findByTelegramId = function(telegramId) {
  return this.findOne({ telegramId });
};

// Static method to find active users by role
userSchema.statics.findActiveByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Pre-save hook to validate role-specific fields
userSchema.pre('save', function(next) {
  if (this.role === 'vendor' && !this.vendorId) {
    // Vendor role requires vendorId (will be set after vendor creation)
  }
  if (this.role === 'courier' && !this.courierId) {
    // Courier role requires courierId (will be set after courier creation)
  }
  next();
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
