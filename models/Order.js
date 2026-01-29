const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: Number,
    required: true,
    index: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: ''
    }
  },
  orderDetails: {
    type: String,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['cash', 'card'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'delivering', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  courierId: {
    type: Number,
    default: null,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  amount: {
    type: Number,
    default: 0
  }
});

// Index for efficient queries
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ courierId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
