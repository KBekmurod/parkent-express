const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  vendorId: {
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
  nameUz: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  descriptionUz: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'appetizers',
      'main_course',
      'desserts',
      'beverages',
      'salads',
      'soups',
      'pizza',
      'burgers',
      'sushi',
      'pasta',
      'seafood',
      'vegetarian',
      'grocery',
      'bakery',
      'dairy',
      'meat',
      'fruits',
      'vegetables',
      'snacks',
      'medicine',
      'other'
    ]
  },
  imageUrl: {
    type: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15,
    min: 0
  },
  weight: {
    type: String
  },
  calories: {
    type: Number,
    min: 0
  },
  ingredients: [{
    type: String
  }],
  allergens: [{
    type: String
  }],
  spicyLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    validUntil: Date
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes
productSchema.index({ vendorId: 1, isAvailable: 1 });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ vendorId: 1, category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ soldCount: -1 });

// Virtual for display name based on locale
productSchema.virtual('displayName').get(function() {
  return this.nameUz || this.name;
});

// Virtual for display description based on locale
productSchema.virtual('displayDescription').get(function() {
  return this.descriptionUz || this.description;
});

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (!this.discount || !this.discount.percentage || this.discount.percentage === 0) {
    return this.price;
  }

  if (this.discount.validUntil && this.discount.validUntil < new Date()) {
    return this.price;
  }

  return this.price * (1 - this.discount.percentage / 100);
});

// Virtual for has active discount
productSchema.virtual('hasActiveDiscount').get(function() {
  if (!this.discount || !this.discount.percentage || this.discount.percentage === 0) {
    return false;
  }

  if (this.discount.validUntil && this.discount.validUntil < new Date()) {
    return false;
  }

  return true;
});

// Virtual for is popular
productSchema.virtual('isPopular').get(function() {
  return this.soldCount > 50;
});

// Method to increment view count
productSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment sold count
productSchema.methods.incrementSales = function(quantity = 1) {
  this.soldCount += quantity;
  return this.save();
};

// Method to toggle availability
productSchema.methods.toggleAvailability = function() {
  this.isAvailable = !this.isAvailable;
  return this.save();
};

// Method to set discount
productSchema.methods.setDiscount = function(percentage, validUntil) {
  this.discount = {
    percentage,
    validUntil
  };
  return this.save();
};

// Method to remove discount
productSchema.methods.removeDiscount = function() {
  this.discount = {
    percentage: 0,
    validUntil: null
  };
  return this.save();
};

// Method to check if product is available
productSchema.methods.checkAvailability = async function() {
  if (!this.isAvailable) {
    return false;
  }

  const Vendor = mongoose.model('Vendor');
  const vendor = await Vendor.findById(this.vendorId);
  
  if (!vendor) {
    return false;
  }

  return vendor.isActive && !vendor.isPaused && vendor.checkIfOpenNow();
};

// Static method to find products by vendor
productSchema.statics.findByVendor = function(vendorId, availableOnly = true) {
  const query = { vendorId };
  if (availableOnly) {
    query.isAvailable = true;
  }
  return this.find(query).sort({ category: 1, name: 1 });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category, availableOnly = true) {
  const query = { category };
  if (availableOnly) {
    query.isAvailable = true;
  }
  return this.find(query).sort({ soldCount: -1 });
};

// Static method to find popular products
productSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isAvailable: true })
    .sort({ soldCount: -1 })
    .limit(limit);
};

// Static method to find discounted products
productSchema.statics.findDiscounted = function() {
  return this.find({
    isAvailable: true,
    'discount.percentage': { $gt: 0 },
    $or: [
      { 'discount.validUntil': { $exists: false } },
      { 'discount.validUntil': null },
      { 'discount.validUntil': { $gte: new Date() } }
    ]
  });
};

// Pre-save hook to validate discount
productSchema.pre('save', function(next) {
  if (this.discount && this.discount.percentage > 0) {
    if (this.discount.percentage < 0 || this.discount.percentage > 100) {
      return next(new Error('Discount percentage must be between 0 and 100'));
    }
  }
  next();
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
