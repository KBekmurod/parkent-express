const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
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
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  location: {
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
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  workingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    sunday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  imageUrl: String,
  category: {
    type: String,
    enum: ['restaurant', 'cafe', 'grocery', 'pharmacy', 'other'],
    default: 'restaurant'
  }
}, {
  timestamps: true
});

// Indexes
vendorSchema.index({ isActive: 1 });
vendorSchema.index({ rating: -1 });
vendorSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
vendorSchema.index({ category: 1 });

// Virtual for display name based on locale
vendorSchema.virtual('displayName').get(function() {
  return this.nameUz || this.name;
});

// Virtual for display description based on locale
vendorSchema.virtual('displayDescription').get(function() {
  return this.descriptionUz || this.description;
});

// Virtual for is open now
vendorSchema.virtual('isOpenNow').get(function() {
  return this.checkIfOpenNow();
});

// Method to check if vendor is open now
vendorSchema.methods.checkIfOpenNow = function() {
  if (!this.isActive || this.isPaused) {
    return false;
  }

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const daySchedule = this.workingHours[currentDay];

  if (!daySchedule || !daySchedule.isOpen) {
    return false;
  }

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  return currentTime >= daySchedule.openTime && currentTime <= daySchedule.closeTime;
};

// Method to get working hours for a specific day
vendorSchema.methods.getWorkingHours = function(day) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days.includes(day.toLowerCase()) 
    ? day.toLowerCase() 
    : days[new Date().getDay()];
  
  return this.workingHours[dayName];
};

// Method to update rating
vendorSchema.methods.updateRating = async function(newRating) {
  const Order = mongoose.model('Order');
  
  const orders = await Order.find({
    vendorId: this._id,
    rating: { $exists: true, $ne: null }
  });

  if (orders.length === 0) {
    this.rating = 0;
  } else {
    const totalRating = orders.reduce((sum, order) => sum + order.rating, 0);
    this.rating = totalRating / orders.length;
  }

  return this.save();
};

// Method to increment total orders
vendorSchema.methods.incrementOrders = function() {
  this.totalOrders += 1;
  return this.save();
};

// Method to toggle pause status
vendorSchema.methods.togglePause = function() {
  this.isPaused = !this.isPaused;
  return this.save();
};

// Static method to find vendors near location
vendorSchema.statics.findNearLocation = function(latitude, longitude, maxDistance = 10) {
  // Simple distance calculation - in production, use MongoDB geospatial queries
  return this.find({
    isActive: true,
    isPaused: false
  });
};

// Static method to find open vendors
vendorSchema.statics.findOpenNow = async function() {
  const vendors = await this.find({ isActive: true, isPaused: false });
  return vendors.filter(vendor => vendor.checkIfOpenNow());
};

// Ensure virtuals are included in JSON
vendorSchema.set('toJSON', { virtuals: true });
vendorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vendor', vendorSchema);
