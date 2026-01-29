const mongoose = require('mongoose');

const courierSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  vehicleType: {
    type: String,
    enum: ['bicycle', 'motorcycle', 'car', 'scooter', 'foot'],
    required: true
  },
  vehicleNumber: {
    type: String,
    trim: true
  },
  currentLocation: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  stats: {
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    todayDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    todayEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  documents: {
    licenseNumber: String,
    licenseExpiryDate: Date,
    registrationNumber: String,
    insuranceNumber: String,
    insuranceExpiryDate: Date,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  workingHours: {
    preferredShift: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'],
      default: 'flexible'
    },
    maxHoursPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 12
    }
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branchCode: String
  }
}, {
  timestamps: true
});

// Indexes
courierSchema.index({ isAvailable: 1, isOnline: 1 });
courierSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });
courierSchema.index({ 'stats.rating': -1 });
courierSchema.index({ 'stats.totalDeliveries': -1 });

// Virtual for is busy
courierSchema.virtual('isBusy').get(function() {
  return !!this.currentOrderId;
});

// Virtual for average rating
courierSchema.virtual('averageRating').get(function() {
  return this.stats.totalRatings > 0 
    ? this.stats.rating 
    : 0;
});

// Virtual for documents status
courierSchema.virtual('documentsComplete').get(function() {
  return !!(
    this.documents.licenseNumber &&
    this.documents.registrationNumber &&
    this.documents.isVerified
  );
});

// Virtual for can accept orders
courierSchema.virtual('canAcceptOrders').get(function() {
  return this.isOnline && 
         this.isAvailable && 
         !this.currentOrderId && 
         this.documents.isVerified;
});

// Method to update location
courierSchema.methods.updateLocation = function(latitude, longitude) {
  this.currentLocation = {
    latitude,
    longitude,
    updatedAt: new Date()
  };
  return this.save();
};

// Method to toggle online status
courierSchema.methods.toggleOnline = function() {
  this.isOnline = !this.isOnline;
  if (!this.isOnline) {
    this.isAvailable = false;
  }
  return this.save();
};

// Method to toggle availability
courierSchema.methods.toggleAvailability = function() {
  if (!this.isOnline) {
    throw new Error('Courier must be online to change availability');
  }
  this.isAvailable = !this.isAvailable;
  return this.save();
};

// Method to assign order
courierSchema.methods.assignOrder = function(orderId) {
  if (this.currentOrderId) {
    throw new Error('Courier already has an active order');
  }
  if (!this.canAcceptOrders) {
    throw new Error('Courier cannot accept orders at this time');
  }
  
  this.currentOrderId = orderId;
  this.isAvailable = false;
  return this.save();
};

// Method to complete order
courierSchema.methods.completeOrder = async function(deliveryFee) {
  if (!this.currentOrderId) {
    throw new Error('No active order to complete');
  }

  this.currentOrderId = null;
  this.isAvailable = true;
  
  // Update stats
  this.stats.totalDeliveries += 1;
  this.stats.todayDeliveries += 1;
  this.stats.todayEarnings += deliveryFee;
  this.stats.totalEarnings += deliveryFee;

  return this.save();
};

// Method to update rating
courierSchema.methods.updateRating = async function(newRating) {
  const totalRatings = this.stats.totalRatings;
  const currentRating = this.stats.rating;
  
  this.stats.totalRatings += 1;
  this.stats.rating = ((currentRating * totalRatings) + newRating) / this.stats.totalRatings;

  return this.save();
};

// Method to reset daily stats
courierSchema.methods.resetDailyStats = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastReset = new Date(this.stats.lastResetDate);
  lastReset.setHours(0, 0, 0, 0);

  if (today > lastReset) {
    this.stats.todayDeliveries = 0;
    this.stats.todayEarnings = 0;
    this.stats.lastResetDate = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to calculate distance from a point
courierSchema.methods.calculateDistance = function(latitude, longitude) {
  if (!this.currentLocation.latitude || !this.currentLocation.longitude) {
    return null;
  }

  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (latitude - this.currentLocation.latitude) * Math.PI / 180;
  const dLon = (longitude - this.currentLocation.longitude) * Math.PI / 180;
  const lat1 = this.currentLocation.latitude * Math.PI / 180;
  const lat2 = latitude * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
};

// Static method to find available couriers
courierSchema.statics.findAvailable = function() {
  return this.find({
    isOnline: true,
    isAvailable: true,
    currentOrderId: null,
    'documents.isVerified': true
  });
};

// Static method to find nearest courier
courierSchema.statics.findNearest = async function(latitude, longitude, maxDistance = 5) {
  const availableCouriers = await this.findAvailable();
  
  const couriersWithDistance = availableCouriers
    .map(courier => ({
      courier,
      distance: courier.calculateDistance(latitude, longitude)
    }))
    .filter(item => item.distance !== null && item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  return couriersWithDistance.length > 0 
    ? couriersWithDistance[0].courier 
    : null;
};

// Static method to get top couriers
courierSchema.statics.getTopCouriers = function(limit = 10) {
  return this.find({ 'documents.isVerified': true })
    .sort({ 'stats.rating': -1, 'stats.totalDeliveries': -1 })
    .limit(limit);
};

// Pre-save hook to reset daily stats if needed
courierSchema.pre('save', async function(next) {
  if (!this.isNew) {
    await this.resetDailyStats();
  }
  next();
});

// Ensure virtuals are included in JSON
courierSchema.set('toJSON', { virtuals: true });
courierSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Courier', courierSchema);
