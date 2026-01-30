const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  telegramId: {
    type: String,
    required: true,
    index: true
  },
  sessionType: {
    type: String,
    enum: [
      'registration',
      'order_creation',
      'vendor_registration',
      'courier_registration',
      'product_creation',
      'profile_update',
      'address_input',
      'payment_selection',
      'rating_submission',
      'support_chat',
      'other'
    ],
    required: true
  },
  currentStep: {
    type: String,
    default: 'start'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  state: {
    type: String,
    enum: ['active', 'completed', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  metadata: {
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    steps: [{
      step: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      data: mongoose.Schema.Types.Mixed
    }]
  }
}, {
  timestamps: true
});

sessionSchema.index({ userId: 1, state: 1 });
sessionSchema.index({ telegramId: 1, state: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ state: 1, expiresAt: 1 });

sessionSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const defaultTimeout = 30 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + defaultTimeout);
  }
  
  this.metadata.lastActivityAt = new Date();
  next();
});

sessionSchema.methods.updateStep = async function(step, stepData = {}) {
  this.currentStep = step;
  
  this.metadata.steps.push({
    step,
    timestamp: new Date(),
    data: stepData
  });
  
  this.metadata.lastActivityAt = new Date();
  
  return await this.save();
};

sessionSchema.methods.updateData = async function(newData) {
  this.data = { ...this.data, ...newData };
  this.metadata.lastActivityAt = new Date();
  return await this.save();
};

sessionSchema.methods.complete = async function() {
  this.state = 'completed';
  this.metadata.completedAt = new Date();
  return await this.save();
};

sessionSchema.methods.cancel = async function() {
  this.state = 'cancelled';
  return await this.save();
};

sessionSchema.methods.extend = async function(minutes = 30) {
  this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  this.metadata.lastActivityAt = new Date();
  return await this.save();
};

sessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

sessionSchema.methods.isActive = function() {
  return this.state === 'active' && !this.isExpired();
};

sessionSchema.statics.findActiveByUserId = function(userId) {
  return this.findOne({
    userId,
    state: 'active',
    expiresAt: { $gt: new Date() }
  });
};

sessionSchema.statics.findActiveByTelegramId = function(telegramId) {
  return this.findOne({
    telegramId,
    state: 'active',
    expiresAt: { $gt: new Date() }
  });
};

sessionSchema.statics.createSession = async function(userId, telegramId, sessionType, initialData = {}, timeoutMinutes = 30) {
  await this.updateMany(
    { 
      telegramId,
      state: 'active'
    },
    {
      $set: { state: 'cancelled' }
    }
  );
  
  const session = new this({
    userId,
    telegramId,
    sessionType,
    data: initialData,
    state: 'active',
    expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000)
  });
  
  return await session.save();
};

sessionSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      state: 'active',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { state: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('Session', sessionSchema);
