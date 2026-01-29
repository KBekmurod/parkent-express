const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  subcategory: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'UZS'
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  stock: {
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      default: 'piece'
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    trackStock: {
      type: Boolean,
      default: false
    }
  },
  specifications: {
    weight: {
      value: Number,
      unit: String
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String
    },
    ingredients: [String],
    allergens: [String],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }
  },
  options: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['radio', 'checkbox', 'select'],
      default: 'radio'
    },
    required: {
      type: Boolean,
      default: false
    },
    choices: [{
      name: String,
      priceModifier: {
        type: Number,
        default: 0
      },
      isDefault: {
        type: Boolean,
        default: false
      }
    }]
  }],
  tags: [String],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    orders: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  metadata: {
    sku: String,
    barcode: String,
    preparationTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

productSchema.index({ vendor: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ isFeatured: -1, 'rating.average': -1 });
productSchema.index({ price: 1 });

productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  if (this.originalPrice && this.price < this.originalPrice) {
    this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  
  if (this.stock.trackStock && this.stock.quantity <= 0) {
    this.isAvailable = false;
  }
  
  next();
});

productSchema.methods.checkAvailability = function(quantity = 1) {
  if (!this.isAvailable) {
    return { available: false, reason: 'Product is not available' };
  }
  
  if (this.stock.trackStock) {
    if (this.stock.quantity < quantity) {
      return { available: false, reason: 'Insufficient stock' };
    }
  }
  
  return { available: true };
};

productSchema.methods.decreaseStock = async function(quantity) {
  if (this.stock.trackStock) {
    this.stock.quantity -= quantity;
    
    if (this.stock.quantity <= 0) {
      this.isAvailable = false;
    } else if (this.stock.quantity <= this.stock.lowStockThreshold) {
      this.metadata.lowStock = true;
    }
    
    await this.save();
  }
};

productSchema.methods.increaseStock = async function(quantity) {
  if (this.stock.trackStock) {
    this.stock.quantity += quantity;
    
    if (this.stock.quantity > 0) {
      this.isAvailable = true;
      this.metadata.lowStock = false;
    }
    
    await this.save();
  }
};

productSchema.methods.updateRating = async function(newRating) {
  this.rating.count += 1;
  this.rating.average = ((this.rating.average * (this.rating.count - 1)) + newRating) / this.rating.count;
  return await this.save();
};

productSchema.virtual('hasDiscount').get(function() {
  return this.originalPrice && this.price < this.originalPrice;
});

productSchema.virtual('finalPrice').get(function() {
  return this.price;
});

productSchema.virtual('isLowStock').get(function() {
  if (!this.stock.trackStock) return false;
  return this.stock.quantity <= this.stock.lowStockThreshold && this.stock.quantity > 0;
});

productSchema.virtual('isOutOfStock').get(function() {
  if (!this.stock.trackStock) return false;
  return this.stock.quantity <= 0;
});

module.exports = mongoose.model('Product', productSchema);
