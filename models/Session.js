const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  botType: {
    type: String,
    enum: ['customer', 'courier', 'admin'],
    required: true
  },
  state: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: {}
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
});

// TTL index to auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries
sessionSchema.index({ userId: 1, botType: 1 });

module.exports = mongoose.model('Session', sessionSchema);
