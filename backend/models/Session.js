const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  chatId: {
    type: String,
    required: true,
    index: true
  },
  scene: {
    type: String,
    default: 'main'
  },
  state: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  language: {
    type: String,
    enum: ['uz', 'ru', 'en'],
    default: 'uz'
  },
  lastCommand: {
    type: String
  },
  lastMessageId: {
    type: Number
  },
  cart: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    price: {
      type: Number,
      min: 0
    }
  }],
  selectedVendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  deliveryLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  orderInProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000),
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
sessionSchema.index({ userId: 1, chatId: 1 });

// Virtual for cart total
sessionSchema.virtual('cartTotal').get(function() {
  if (!this.cart || this.cart.length === 0) {
    return 0;
  }
  return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Virtual for cart items count
sessionSchema.virtual('cartItemsCount').get(function() {
  if (!this.cart || this.cart.length === 0) {
    return 0;
  }
  return this.cart.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for has cart items
sessionSchema.virtual('hasCartItems').get(function() {
  return this.cart && this.cart.length > 0;
});

// Virtual for is expired
sessionSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Method to update expiry time
sessionSchema.methods.updateExpiry = function(minutes = 30) {
  this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  this.updatedAt = new Date();
  return this.save();
};

// Method to change scene
sessionSchema.methods.changeScene = function(newScene, initialState = {}) {
  this.scene = newScene;
  this.state = initialState;
  return this.updateExpiry();
};

// Method to update state
sessionSchema.methods.updateState = function(updates) {
  this.state = { ...this.state, ...updates };
  return this.updateExpiry();
};

// Method to clear state
sessionSchema.methods.clearState = function() {
  this.state = {};
  return this.updateExpiry();
};

// Method to add item to cart
sessionSchema.methods.addToCart = function(product, quantity = 1) {
  const existingItemIndex = this.cart.findIndex(
    item => item.productId.toString() === product._id.toString()
  );

  if (existingItemIndex > -1) {
    this.cart[existingItemIndex].quantity += quantity;
  } else {
    this.cart.push({
      productId: product._id,
      productName: product.name,
      quantity,
      price: product.price
    });
  }

  return this.updateExpiry();
};

// Method to remove item from cart
sessionSchema.methods.removeFromCart = function(productId) {
  this.cart = this.cart.filter(
    item => item.productId.toString() !== productId.toString()
  );
  return this.updateExpiry();
};

// Method to update cart item quantity
sessionSchema.methods.updateCartItemQuantity = function(productId, quantity) {
  const item = this.cart.find(
    item => item.productId.toString() === productId.toString()
  );

  if (item) {
    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }
    item.quantity = quantity;
  }

  return this.updateExpiry();
};

// Method to clear cart
sessionSchema.methods.clearCart = function() {
  this.cart = [];
  this.selectedVendorId = null;
  return this.updateExpiry();
};

// Method to set delivery location
sessionSchema.methods.setDeliveryLocation = function(latitude, longitude, address) {
  this.deliveryLocation = { latitude, longitude, address };
  return this.updateExpiry();
};

// Method to clear delivery location
sessionSchema.methods.clearDeliveryLocation = function() {
  this.deliveryLocation = null;
  return this.updateExpiry();
};

// Method to set language
sessionSchema.methods.setLanguage = function(language) {
  this.language = language;
  return this.updateExpiry();
};

// Method to reset session
sessionSchema.methods.reset = function() {
  this.scene = 'main';
  this.state = {};
  this.cart = [];
  this.selectedVendorId = null;
  this.deliveryLocation = null;
  this.orderInProgress = null;
  this.lastCommand = null;
  return this.updateExpiry();
};

// Static method to find or create session
sessionSchema.statics.findOrCreate = async function(userId, chatId) {
  let session = await this.findOne({ userId, chatId });
  
  if (!session) {
    session = await this.create({ userId, chatId });
  } else if (session.isExpired) {
    await session.reset();
  } else {
    await session.updateExpiry();
  }

  return session;
};

// Static method to find active session
sessionSchema.statics.findActive = function(userId, chatId) {
  return this.findOne({
    userId,
    chatId,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to cleanup expired sessions
sessionSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Pre-save hook to update timestamps
sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtuals are included in JSON
sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Session', sessionSchema);
