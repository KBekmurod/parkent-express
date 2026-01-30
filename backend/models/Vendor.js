const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['restaurant', 'cafe', 'grocery', 'pharmacy', 'electronics', 'clothing', 'other']
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  logo: {
    url: String,
    alt: String
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      default: 'Parkent'
    },
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
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: String,
    telegram: String,
    whatsapp: String
  },
  workingHours: [{
    day: {
      type: Number,
      min: 0,
      max: 6,
      required: true
    },
    open: {
      type: String,
      required: true
    },
    close: {
      type: String,
      required: true
    },
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  settings: {
    acceptsOrders: {
      type: Boolean,
      default: true
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    preparationTime: {
      type: Number,
      default: 30,
      min: 0
    },
    deliveryRadius: {
      type: Number,
      default: 5,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 5000,
      min: 0
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  stats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
    cancelledOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  metadata: {
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    suspendedAt: Date,
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    suspensionReason: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

vendorSchema.index({ 'address.location': '2dsphere' });
vendorSchema.index({ name: 'text', description: 'text', tags: 'text' });
vendorSchema.index({ category: 1, isActive: 1 });
vendorSchema.index({ owner: 1 });
vendorSchema.index({ isFeatured: -1, 'rating.average': -1 });

vendorSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

vendorSchema.methods.isOpenNow = function() {
  if (!this.isActive || !this.settings.acceptsOrders) {
    return false;
  }
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const schedule = this.workingHours.find(wh => wh.day === currentDay);
  
  if (!schedule || schedule.isClosed) {
    return false;
  }
  
  const [openHour, openMin] = schedule.open.split(':').map(Number);
  const [closeHour, closeMin] = schedule.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

vendorSchema.methods.canAcceptOrder = function(orderAmount) {
  if (!this.isActive || !this.settings.acceptsOrders) {
    return { canAccept: false, reason: 'Vendor is not accepting orders' };
  }
  
  if (!this.isOpenNow()) {
    return { canAccept: false, reason: 'Vendor is closed' };
  }
  
  if (this.settings.minOrderAmount && orderAmount < this.settings.minOrderAmount) {
    return { canAccept: false, reason: `Minimum order amount is ${this.settings.minOrderAmount}` };
  }
  
  if (this.settings.maxOrderAmount && orderAmount > this.settings.maxOrderAmount) {
    return { canAccept: false, reason: `Maximum order amount is ${this.settings.maxOrderAmount}` };
  }
  
  return { canAccept: true };
};

vendorSchema.methods.updateRating = async function(newRating) {
  this.rating.count += 1;
  this.rating.average = ((this.rating.average * (this.rating.count - 1)) + newRating) / this.rating.count;
  return await this.save();
};

vendorSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'vendor'
});

vendorSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    'address.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  });
};

module.exports = mongoose.model('Vendor', vendorSchema);
