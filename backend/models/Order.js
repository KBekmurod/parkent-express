const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  courier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'assigned',
      'picked_up',
      'in_transit',
      'delivered',
      'cancelled',
      'rejected'
    ],
    default: 'pending',
    required: true,
    index: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    notes: String
  }],
  pricing: {
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
    serviceFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    building: String,
    apartment: String,
    entrance: String,
    floor: String,
    instructions: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online'],
    required: true,
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  notes: {
    customer: String,
    vendor: String,
    courier: String,
    admin: String
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }],
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  preparationTime: {
    type: Number,
    default: 30
  },
  rating: {
    vendor: {
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      timestamp: Date
    },
    courier: {
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      timestamp: Date
    }
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  metadata: {
    source: {
      type: String,
      enum: ['telegram', 'web', 'admin'],
      default: 'telegram'
    },
    deviceInfo: String,
    ipAddress: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.index({ 'deliveryAddress.location': '2dsphere' });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ vendor: 1, status: 1 });
orderSchema.index({ courier: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}${random}`;
  }
  
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      actor: this.modifiedBy || null
    });
  }
  
  next();
});

orderSchema.methods.canTransitionTo = function(newStatus) {
  const transitions = {
    'pending': ['confirmed', 'rejected', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['assigned', 'cancelled'],
    'assigned': ['picked_up', 'cancelled'],
    'picked_up': ['in_transit', 'cancelled'],
    'in_transit': ['delivered', 'cancelled'],
    'delivered': [],
    'cancelled': [],
    'rejected': []
  };
  
  return transitions[this.status]?.includes(newStatus) || false;
};

orderSchema.methods.calculateTotal = function() {
  const subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.pricing.subtotal = subtotal;
  this.pricing.total = subtotal + this.pricing.deliveryFee + this.pricing.serviceFee - this.pricing.discount;
  return this.pricing.total;
};

orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}${random}`;
};

orderSchema.virtual('isActive').get(function() {
  return !['delivered', 'cancelled', 'rejected'].includes(this.status);
});

orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed', 'preparing', 'ready', 'assigned'].includes(this.status);
});

module.exports = mongoose.model('Order', orderSchema);
