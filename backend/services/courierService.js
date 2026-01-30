const Courier = require('../models/Courier');
const User = require('../models/User');
const { paginate, buildPaginationResponse, calculateDistance } = require('../utils/helpers');
const { COURIER_STATUS } = require('../utils/constants');

class CourierService {
  async registerCourier(userId, courierData) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const existingCourier = await Courier.findOne({ user: userId });
    
    if (existingCourier) {
      throw new Error('User is already registered as a courier');
    }
    
    const courier = new Courier({
      user: userId,
      ...courierData,
      status: COURIER_STATUS.PENDING
    });
    
    await courier.save();
    
    if (user.role !== 'courier' && user.role !== 'admin') {
      user.role = 'courier';
      await user.save();
    }
    
    return courier;
  }
  
  async getCourierById(courierId) {
    const courier = await Courier.findById(courierId)
      .populate('user', '-password')
      .populate('activeOrder');
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    return courier;
  }
  
  async getCourierByUserId(userId) {
    const courier = await Courier.findOne({ user: userId })
      .populate('user', '-password')
      .populate('activeOrder');
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    return courier;
  }
  
  async updateCourier(userId, updates) {
    const courier = await Courier.findOne({ user: userId });
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    const allowedUpdates = [
      'vehicle',
      'documents',
      'bankDetails',
      'schedule',
      'settings'
    ];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
          courier[key] = { ...courier[key], ...updates[key] };
        } else {
          courier[key] = updates[key];
        }
      }
    });
    
    await courier.save();
    
    return courier;
  }
  
  async updateLocation(userId, longitude, latitude, accuracy, heading, speed) {
    const courier = await Courier.findOne({ user: userId });
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    await courier.updateLocation(longitude, latitude, accuracy, heading, speed);
    
    return courier;
  }
  
  async goOnline(userId) {
    const courier = await Courier.findOne({ user: userId });
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    if (courier.status !== COURIER_STATUS.ACTIVE) {
      throw new Error('Courier account must be active');
    }
    
    if (!courier.isDocumentsVerified()) {
      throw new Error('Documents must be verified');
    }
    
    await courier.goOnline();
    
    return courier;
  }
  
  async goOffline(userId) {
    const courier = await Courier.findOne({ user: userId });
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    if (courier.activeOrder) {
      throw new Error('Cannot go offline with active order');
    }
    
    await courier.goOffline();
    
    return courier;
  }
  
  async assignOrder(userId, orderId) {
    const courier = await Courier.findOne({ user: userId });
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    if (!courier.isOnline || !courier.isAvailable) {
      throw new Error('Courier is not available');
    }
    
    await courier.assignOrder(orderId);
    
    return courier;
  }
  
  async completeOrder(userId, orderId, earnings) {
    const courier = await Courier.findOne({ user: userId });
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    if (!courier.activeOrder || courier.activeOrder.toString() !== orderId) {
      throw new Error('Invalid order');
    }
    
    await courier.completeOrder(earnings);
    
    return courier;
  }
  
  async cancelOrder(userId) {
    const courier = await Courier.findOne({ user: userId });
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    if (!courier.activeOrder) {
      throw new Error('No active order');
    }
    
    await courier.cancelOrder();
    
    return courier;
  }
  
  async listCouriers(filters = {}, page = 1, limit = 10) {
    const { skip, limit: paginationLimit } = paginate(page, limit);
    
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.isOnline !== undefined) {
      query.isOnline = filters.isOnline;
    }
    
    if (filters.isAvailable !== undefined) {
      query.isAvailable = filters.isAvailable;
    }
    
    if (filters.vehicleType) {
      query['vehicle.type'] = filters.vehicleType;
    }
    
    const [couriers, total] = await Promise.all([
      Courier.find(query)
        .populate('user', '-password')
        .populate('activeOrder')
        .skip(skip)
        .limit(paginationLimit)
        .sort({ 'rating.average': -1, createdAt: -1 }),
      Courier.countDocuments(query)
    ]);
    
    return buildPaginationResponse(couriers, total, page, paginationLimit);
  }
  
  async findAvailableCouriers(longitude, latitude, maxDistanceKm = 10) {
    const maxDistanceMeters = maxDistanceKm * 1000;
    
    const couriers = await Courier.findAvailableNearby(longitude, latitude, maxDistanceMeters);
    
    const couriersWithDistance = couriers.map(courier => {
      const distance = calculateDistance(
        latitude,
        longitude,
        courier.currentLocation.coordinates[1],
        courier.currentLocation.coordinates[0]
      );
      
      return {
        ...courier.toObject(),
        distance: parseFloat(distance.toFixed(2))
      };
    });
    
    return couriersWithDistance.sort((a, b) => {
      if (a.rating.average !== b.rating.average) {
        return b.rating.average - a.rating.average;
      }
      return a.distance - b.distance;
    });
  }
  
  async approveCourier(courierId, adminId) {
    const courier = await Courier.findById(courierId);
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    if (!courier.isDocumentsVerified()) {
      throw new Error('Documents must be verified first');
    }
    
    courier.status = COURIER_STATUS.ACTIVE;
    courier.metadata.approvedAt = new Date();
    courier.metadata.approvedBy = adminId;
    
    await courier.save();
    
    return courier;
  }
  
  async rejectCourier(courierId, adminId, reason) {
    const courier = await Courier.findById(courierId);
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    courier.status = COURIER_STATUS.REJECTED;
    courier.metadata.rejectionReason = reason;
    
    await courier.save();
    
    return courier;
  }
  
  async suspendCourier(courierId, adminId, reason) {
    const courier = await Courier.findById(courierId);
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    courier.status = COURIER_STATUS.SUSPENDED;
    courier.isOnline = false;
    courier.isAvailable = false;
    courier.metadata.suspendedAt = new Date();
    courier.metadata.suspendedBy = adminId;
    courier.metadata.suspensionReason = reason;
    
    await courier.save();
    
    return courier;
  }
  
  async verifyDocument(courierId, documentType, adminId) {
    const courier = await Courier.findById(courierId);
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    if (documentType === 'identityCard') {
      courier.documents.identityCard.verified = true;
      courier.documents.identityCard.verifiedAt = new Date();
    } else if (documentType === 'driverLicense') {
      courier.documents.driverLicense.verified = true;
      courier.documents.driverLicense.verifiedAt = new Date();
    } else if (documentType === 'backgroundCheck') {
      courier.documents.backgroundCheck.status = 'approved';
      courier.documents.backgroundCheck.completedAt = new Date();
    }
    
    await courier.save();
    
    return courier;
  }
  
  async getCourierStats(userId) {
    const courier = await Courier.findOne({ user: userId })
      .populate('user', '-password');
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    const Order = require('../models/Order');
    
    const recentOrders = await Order.find({
      courier: userId,
      status: 'delivered'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('vendor', 'name')
      .populate('customer', 'firstName lastName');
    
    return {
      courier,
      recentOrders,
      stats: courier.stats
    };
  }
  
  async withdrawEarnings(userId, amount) {
    const courier = await Courier.findOne({ user: userId });
    
    if (!courier) {
      throw new Error('Courier not found');
    }
    
    if (amount > courier.earnings.currentBalance) {
      throw new Error('Insufficient balance');
    }
    
    courier.earnings.currentBalance -= amount;
    courier.earnings.totalWithdrawn += amount;
    courier.earnings.pendingAmount = Math.max(0, courier.earnings.pendingAmount - amount);
    
    await courier.save();
    
    return courier;
  }
}

module.exports = new CourierService();
