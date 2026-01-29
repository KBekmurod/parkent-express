const Courier = require('../models/Courier');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { 
  NotFoundError, 
  ValidationError, 
  BadRequestError 
} = require('../utils/errorTypes');

class CourierService {
  async createCourier(courierData) {
    try {
      logger.info('Creating new courier', { userId: courierData.userId });

      const existingCourier = await Courier.findOne({ userId: courierData.userId });
      if (existingCourier) {
        throw new BadRequestError('Courier already exists for this user');
      }

      const courier = new Courier(courierData);
      await courier.save();

      logger.info('Courier created successfully', { courierId: courier._id });
      return courier;
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      logger.error('Error creating courier', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getCourierById(courierId) {
    try {
      const courier = await Courier.findById(courierId).populate('userId');

      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      return courier;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting courier by ID', { courierId, error: error.message });
      throw error;
    }
  }

  async getCourierByUserId(userId) {
    try {
      const courier = await Courier.findOne({ userId }).populate('userId');

      if (!courier) {
        throw new NotFoundError('Courier not found for this user', 'Courier');
      }

      return courier;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting courier by user ID', { userId, error: error.message });
      throw error;
    }
  }

  async updateCourier(courierId, updateData) {
    try {
      logger.info('Updating courier', { courierId });

      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      const allowedFields = [
        'vehicleType', 'vehicleNumber', 'documents', 
        'workingHours', 'bankDetails'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          courier[field] = updateData[field];
        }
      });

      await courier.save();

      logger.info('Courier updated successfully', { courierId });
      return courier;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating courier', { courierId, error: error.message });
      throw error;
    }
  }

  async updateCourierLocation(courierId, latitude, longitude) {
    try {
      logger.debug('Updating courier location', { courierId });

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new ValidationError('Invalid coordinates');
      }

      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      await courier.updateLocation(latitude, longitude);

      logger.debug('Courier location updated', { courierId, latitude, longitude });
      return courier;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Error updating courier location', { courierId, error: error.message });
      throw error;
    }
  }

  async toggleCourierOnline(courierId) {
    try {
      logger.info('Toggling courier online status', { courierId });

      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      await courier.toggleOnline();

      logger.info('Courier online status toggled', { courierId, isOnline: courier.isOnline });
      return courier;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error toggling courier online', { courierId, error: error.message });
      throw error;
    }
  }

  async toggleCourierAvailability(courierId) {
    try {
      logger.info('Toggling courier availability', { courierId });

      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      await courier.toggleAvailability();

      logger.info('Courier availability toggled', { 
        courierId, 
        isAvailable: courier.isAvailable 
      });
      return courier;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) throw error;
      logger.error('Error toggling courier availability', { courierId, error: error.message });
      throw error;
    }
  }

  async assignOrderToCourier(courierId, orderId) {
    try {
      logger.info('Assigning order to courier', { courierId, orderId });

      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      await courier.assignOrder(orderId);

      logger.info('Order assigned to courier', { courierId, orderId });
      return courier;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
      logger.error('Error assigning order to courier', { courierId, error: error.message });
      throw error;
    }
  }

  async completeCourierOrder(courierId, deliveryFee) {
    try {
      logger.info('Completing courier order', { courierId });

      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      await courier.completeOrder(deliveryFee);

      logger.info('Courier order completed', { courierId });
      return courier;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
      logger.error('Error completing courier order', { courierId, error: error.message });
      throw error;
    }
  }

  async updateCourierRating(courierId, rating) {
    try {
      logger.info('Updating courier rating', { courierId, rating });

      if (rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      await courier.updateRating(rating);

      logger.info('Courier rating updated', { courierId, newRating: courier.stats.rating });
      return courier;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Error updating courier rating', { courierId, error: error.message });
      throw error;
    }
  }

  async getAvailableCouriers(options = {}) {
    try {
      const couriers = await Courier.findAvailable();

      logger.info('Retrieved available couriers', { count: couriers.length });
      return couriers;
    } catch (error) {
      logger.error('Error getting available couriers', { error: error.message });
      throw error;
    }
  }

  async findNearestCourier(latitude, longitude, maxDistance = 5) {
    try {
      logger.info('Finding nearest courier', { latitude, longitude, maxDistance });

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new ValidationError('Invalid coordinates');
      }

      const courier = await Courier.findNearest(latitude, longitude, maxDistance);

      if (courier) {
        logger.info('Nearest courier found', { courierId: courier._id });
      } else {
        logger.info('No courier found within range');
      }

      return courier;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      logger.error('Error finding nearest courier', { error: error.message });
      throw error;
    }
  }

  async findBestCourierForOrder(order) {
    try {
      logger.info('Finding best courier for order', { orderId: order._id });

      const availableCouriers = await Courier.findAvailable();

      if (availableCouriers.length === 0) {
        logger.warn('No available couriers found');
        return null;
      }

      const vendorLat = order.vendorId?.location?.latitude;
      const vendorLng = order.vendorId?.location?.longitude;

      if (!vendorLat || !vendorLng) {
        logger.warn('Vendor location not available, selecting first available courier');
        return availableCouriers[0];
      }

      const couriersWithScore = availableCouriers
        .map(courier => {
          const distance = courier.calculateDistance(vendorLat, vendorLng);
          
          let score = 0;
          if (distance !== null) {
            score += (10 - Math.min(distance, 10)) * 10;
          }
          
          score += courier.stats.rating * 20;
          score += Math.min(courier.stats.totalDeliveries / 10, 10) * 5;

          return { courier, distance, score };
        })
        .filter(item => item.distance !== null && item.distance <= 10)
        .sort((a, b) => b.score - a.score);

      if (couriersWithScore.length === 0) {
        logger.warn('No courier within range, selecting best rated available');
        return availableCouriers.sort((a, b) => b.stats.rating - a.stats.rating)[0];
      }

      const bestCourier = couriersWithScore[0].courier;
      logger.info('Best courier found', { 
        courierId: bestCourier._id, 
        distance: couriersWithScore[0].distance,
        score: couriersWithScore[0].score
      });

      return bestCourier;
    } catch (error) {
      logger.error('Error finding best courier for order', { error: error.message });
      throw error;
    }
  }

  async getCourierStats(courierId, period = 'all') {
    try {
      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      const now = new Date();
      let startDate;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      const orders = await Order.find({
        courierId,
        createdAt: { $gte: startDate }
      });

      const completedOrders = orders.filter(o => o.status === 'delivered');
      const earnings = completedOrders.reduce((sum, order) => sum + order.deliveryFee, 0);

      const stats = {
        courierId: courier._id,
        period,
        deliveries: completedOrders.length,
        earnings,
        rating: courier.stats.rating,
        totalRatings: courier.stats.totalRatings,
        todayDeliveries: courier.stats.todayDeliveries,
        todayEarnings: courier.stats.todayEarnings,
        totalDeliveries: courier.stats.totalDeliveries,
        totalEarnings: courier.stats.totalEarnings,
        isAvailable: courier.isAvailable,
        isOnline: courier.isOnline
      };

      logger.info('Retrieved courier stats', { courierId, period });
      return stats;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting courier stats', { courierId, error: error.message });
      throw error;
    }
  }

  async getTopCouriers(limit = 10) {
    try {
      const couriers = await Courier.getTopCouriers(limit);

      logger.info('Retrieved top couriers', { count: couriers.length });
      return couriers;
    } catch (error) {
      logger.error('Error getting top couriers', { error: error.message });
      throw error;
    }
  }

  async verifyCourierDocuments(courierId, isVerified = true) {
    try {
      logger.info('Verifying courier documents', { courierId, isVerified });

      const courier = await Courier.findById(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      courier.documents.isVerified = isVerified;
      await courier.save();

      logger.info('Courier documents verified', { courierId, isVerified });
      return courier;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error verifying courier documents', { courierId, error: error.message });
      throw error;
    }
  }

  async getAllCouriers(options = {}) {
    try {
      const { page = 1, limit = 20, isOnline, isAvailable } = options;
      const skip = (page - 1) * limit;

      const query = {};
      if (isOnline !== undefined) {
        query.isOnline = isOnline;
      }
      if (isAvailable !== undefined) {
        query.isAvailable = isAvailable;
      }

      const couriers = await Courier.find(query)
        .populate('userId', 'firstName lastName username phone')
        .skip(skip)
        .limit(limit)
        .sort({ 'stats.rating': -1 });

      const total = await Courier.countDocuments(query);

      logger.info('Retrieved all couriers', { count: couriers.length });

      return {
        couriers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all couriers', { error: error.message });
      throw error;
    }
  }

  async deleteCourier(courierId) {
    try {
      logger.info('Deleting courier', { courierId });

      const courier = await Courier.findByIdAndDelete(courierId);
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      logger.info('Courier deleted successfully', { courierId });
      return courier;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deleting courier', { courierId, error: error.message });
      throw error;
    }
  }
}

module.exports = new CourierService();
