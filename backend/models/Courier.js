const mongoose = require('mongoose');

const courierSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'inactive', 'suspended', 'rejected'],
    default: 'pending',
    index: true
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  isAvailable: {
    type: Boolean,
    default: false,
    index: true
  },
  vehicle: {
    type: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'scooter', 'car'],
      required: true
    },
    make: String,
    model: String,
    year: Number,
    plateNumber: String,
    color: String,
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date
    }
  },
  documents: {
    identityCard: {
      number: String,
      frontImage: String,
      backImage: String,
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date
    },
    driverLicense: {
      number: String,
      frontImage: String,
      backImage: String,
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date
    },
    backgroundCheck: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      completedAt: Date
    }
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    accuracy: Number,
    heading: Number,
    speed: Number
  },
  workingArea: {
    center: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [69.685219, 41.299164]
      }
    },
    radius: {
      type: Number,
      default: 10000
    }
  },
  activeOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  stats: {
    totalDeliveries: {
      type: Number,
      default: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0
    },
    cancelledDeliveries: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    averageDeliveryTime: {
      type: Number,
      default: 0
    },
    totalDistance: {
      type: Number,
      default: 0
    },
    onlineHours: {
      type: Number,
      default: 0
    },
    acceptanceRate: {
      type: Number,
      default: 100
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
      default: 0
    }
  },
  earnings: {
    currentBalance: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    }
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    bankCode: String
  },
  schedule: {
    workingDays: [{
      type: Number,
      min: 0,
      max: 6
    }],
    startTime: String,
    endTime: String
  },
  settings: {
    autoAcceptOrders: {
      type: Boolean,
      default: false
    },
    maxConcurrentOrders: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    preferredDeliveryRadius: {
      type: Number,
      default: 5000
    }
  },
  metadata: {
    lastOnline: Date,
    lastOffline: Date,
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    suspendedAt: Date,
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    suspensionReason: String,
    rejectionReason: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courierSchema.index({ 'currentLocation': '2dsphere' });
courierSchema.index({ isOnline: 1, isAvailable: 1 });
courierSchema.index({ status: 1, isOnline: 1 });

courierSchema.methods.updateLocation = async function(longitude, latitude, accuracy, heading, speed) {
  this.currentLocation.coordinates = [longitude, latitude];
  this.currentLocation.lastUpdated = new Date();
  this.currentLocation.accuracy = accuracy;
  this.currentLocation.heading = heading;
  this.currentLocation.speed = speed;
  return await this.save();
};

courierSchema.methods.goOnline = async function() {
  this.isOnline = true;
  this.isAvailable = !this.activeOrder;
  this.metadata.lastOnline = new Date();
  return await this.save();
};

courierSchema.methods.goOffline = async function() {
  this.isOnline = false;
  this.isAvailable = false;
  this.metadata.lastOffline = new Date();
  return await this.save();
};

courierSchema.methods.assignOrder = async function(orderId) {
  this.activeOrder = orderId;
  this.isAvailable = false;
  return await this.save();
};

courierSchema.methods.completeOrder = async function(earnings) {
  this.activeOrder = null;
  this.isAvailable = this.isOnline;
  this.stats.completedDeliveries += 1;
  this.stats.totalDeliveries += 1;
  this.stats.totalEarnings += earnings;
  this.earnings.currentBalance += earnings;
  this.earnings.pendingAmount += earnings;
  this.earnings.totalEarned += earnings;
  return await this.save();
};

courierSchema.methods.cancelOrder = async function() {
  this.activeOrder = null;
  this.isAvailable = this.isOnline;
  this.stats.cancelledDeliveries += 1;
  this.stats.totalDeliveries += 1;
  return await this.save();
};

courierSchema.methods.updateRating = async function(newRating) {
  this.rating.count += 1;
  this.rating.average = ((this.rating.average * (this.rating.count - 1)) + newRating) / this.rating.count;
  return await this.save();
};

courierSchema.methods.isDocumentsVerified = function() {
  return this.documents.identityCard.verified && 
         this.documents.driverLicense.verified &&
         this.documents.backgroundCheck.status === 'approved';
};

courierSchema.virtual('completionRate').get(function() {
  if (this.stats.totalDeliveries === 0) return 0;
  return (this.stats.completedDeliveries / this.stats.totalDeliveries) * 100;
});

courierSchema.statics.findAvailableNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    'currentLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active',
    isOnline: true,
    isAvailable: true
  });
};

module.exports = mongoose.model('Courier', courierSchema);
