const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  courierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Courier',
    index: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  deliveryLocation: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    address: {
      type: String,
      required: true
    }
  },
  orderDetails: {
    type: String
  },
  paymentType: {
    type: String,
    enum: ['cash', 'card', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'preparing',
      'ready',
      'assigned',
      'picked_up',
      'in_transit',
      'delivered',
      'cancelled'
    ],
    default: 'pending',
    required: true,
    index: true
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  readyAt: Date,
  assignedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  cancellationReason: String
}, {
  timestamps: true
});

// Compound indexes for common queries
orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ vendorId: 1, status: 1 });
orderSchema.index({ courierId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for order duration
orderSchema.virtual('duration').get(function() {
  if (!this.deliveredAt) return null;
  return this.deliveredAt - this.createdAt;
});

// Virtual for is completed
orderSchema.virtual('isCompleted').get(function() {
  return ['delivered', 'cancelled'].includes(this.status);
});

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  const todayStart = new Date(date.setHours(0, 0, 0, 0));
  const todayEnd = new Date(date.setHours(23, 59, 59, 999));
  
  const count = await this.countDocuments({
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });
  
  const orderNum = String(count + 1).padStart(4, '0');
  return `PE-${dateStr}-${orderNum}`;
};

// Method to add status to history
orderSchema.methods.addStatusHistory = function(status, updatedBy, note) {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    updatedBy,
    note
  });
};

// Method to transition status
orderSchema.methods.transitionStatus = async function(newStatus, updatedBy, note) {
  const validTransitions = {
    pending: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled'],
    picked_up: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: []
  };

  const allowedStatuses = validTransitions[this.status] || [];
  
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  this.addStatusHistory(newStatus, updatedBy, note);

  // Update timestamp fields
  const timestampField = `${newStatus.replace('_', '')}At`;
  if (this.schema.path(timestampField)) {
    this[timestampField] = new Date();
  }

  // Special handling for specific statuses
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    if (this.paymentStatus === 'paid') {
      this.paymentStatus = 'refunded';
    }
  }

  return this.save();
};

// Method to assign courier
orderSchema.methods.assignCourier = async function(courierId, updatedBy) {
  if (this.status !== 'ready') {
    throw new Error('Order must be ready before assigning courier');
  }

  this.courierId = courierId;
  await this.transitionStatus('assigned', updatedBy, 'Courier assigned');
  return this;
};

// Method to add rating and feedback
orderSchema.methods.addRating = function(rating, feedback) {
  if (this.status !== 'delivered') {
    throw new Error('Can only rate delivered orders');
  }

  this.rating = rating;
  this.feedback = feedback;
  return this.save();
};

// Method to calculate total
orderSchema.methods.calculateTotal = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal + this.deliveryFee;
  return this;
};

// Pre-save hook to validate and calculate totals
orderSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isNew) {
    this.calculateTotal();
  }
  next();
});

// Pre-save hook to add initial status to history
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.addStatusHistory('pending', this.customerId, 'Order created');
  }
  next();
});

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
