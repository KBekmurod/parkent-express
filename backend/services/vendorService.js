const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { 
  NotFoundError, 
  ValidationError, 
  BadRequestError 
} = require('../utils/errorTypes');

class VendorService {
  async createVendor(vendorData) {
    try {
      logger.info('Creating new vendor', { name: vendorData.name });

      const vendor = new Vendor(vendorData);
      await vendor.save();

      logger.info('Vendor created successfully', { vendorId: vendor._id });
      return vendor;
    } catch (error) {
      logger.error('Error creating vendor', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getVendorById(vendorId) {
    try {
      const vendor = await Vendor.findById(vendorId).populate('ownerId');

      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      return vendor;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting vendor by ID', { vendorId, error: error.message });
      throw error;
    }
  }

  async getVendorByOwnerId(ownerId) {
    try {
      const vendor = await Vendor.findOne({ ownerId }).populate('ownerId');

      if (!vendor) {
        throw new NotFoundError('Vendor not found for this owner', 'Vendor');
      }

      return vendor;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting vendor by owner ID', { ownerId, error: error.message });
      throw error;
    }
  }

  async updateVendor(vendorId, updateData) {
    try {
      logger.info('Updating vendor', { vendorId });

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      const allowedFields = [
        'name', 'nameUz', 'description', 'descriptionUz', 
        'location', 'phone', 'workingHours', 'imageUrl', 
        'category', 'isActive', 'isPaused'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          vendor[field] = updateData[field];
        }
      });

      await vendor.save();

      logger.info('Vendor updated successfully', { vendorId });
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating vendor', { vendorId, error: error.message });
      throw error;
    }
  }

  async toggleVendorPause(vendorId) {
    try {
      logger.info('Toggling vendor pause status', { vendorId });

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      await vendor.togglePause();

      logger.info('Vendor pause status toggled', { vendorId, isPaused: vendor.isPaused });
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error toggling vendor pause', { vendorId, error: error.message });
      throw error;
    }
  }

  async updateWorkingHours(vendorId, day, hours) {
    try {
      logger.info('Updating working hours', { vendorId, day });

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!validDays.includes(day.toLowerCase())) {
        throw new ValidationError(`Invalid day: ${day}`);
      }

      vendor.workingHours[day.toLowerCase()] = hours;
      await vendor.save();

      logger.info('Working hours updated successfully', { vendorId, day });
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Error updating working hours', { vendorId, day, error: error.message });
      throw error;
    }
  }

  async checkIfOpen(vendorId) {
    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      const isOpen = vendor.checkIfOpenNow();

      logger.debug('Checked vendor open status', { vendorId, isOpen });
      return {
        vendorId: vendor._id,
        name: vendor.name,
        isOpen,
        isActive: vendor.isActive,
        isPaused: vendor.isPaused
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error checking if vendor is open', { vendorId, error: error.message });
      throw error;
    }
  }

  async getAllVendors(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        isActive = true, 
        category,
        openNow = false 
      } = options;
      const skip = (page - 1) * limit;

      const query = {};
      if (isActive !== undefined) {
        query.isActive = isActive;
      }
      if (category) {
        query.category = category;
      }

      let vendors = await Vendor.find(query)
        .populate('ownerId', 'firstName lastName username phone')
        .skip(skip)
        .limit(limit)
        .sort({ rating: -1, totalOrders: -1 });

      if (openNow) {
        vendors = vendors.filter(vendor => vendor.checkIfOpenNow());
      }

      const total = await Vendor.countDocuments(query);

      logger.info('Retrieved vendors', { count: vendors.length });

      return {
        vendors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all vendors', { error: error.message });
      throw error;
    }
  }

  async searchVendors(searchQuery, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const query = {
        isActive: true,
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { nameUz: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } }
        ]
      };

      const vendors = await Vendor.find(query)
        .populate('ownerId', 'firstName lastName username')
        .skip(skip)
        .limit(limit)
        .sort({ rating: -1 });

      const total = await Vendor.countDocuments(query);

      logger.info('Searched vendors', { query: searchQuery, count: vendors.length });

      return {
        vendors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching vendors', { searchQuery, error: error.message });
      throw error;
    }
  }

  async incrementVendorOrders(vendorId) {
    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      await vendor.incrementOrders();

      logger.debug('Vendor order count incremented', { vendorId, totalOrders: vendor.totalOrders });
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error incrementing vendor orders', { vendorId, error: error.message });
      throw error;
    }
  }

  async updateVendorRating(vendorId) {
    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      await vendor.updateRating();

      logger.info('Vendor rating updated', { vendorId, rating: vendor.rating });
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating vendor rating', { vendorId, error: error.message });
      throw error;
    }
  }

  async getVendorStats(vendorId, period = 'all') {
    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
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
        vendorId,
        createdAt: { $gte: startDate }
      });

      const completedOrders = orders.filter(o => o.status === 'delivered');
      const cancelledOrders = orders.filter(o => o.status === 'cancelled');
      const pendingOrders = orders.filter(o => 
        !['delivered', 'cancelled'].includes(o.status)
      );

      const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = completedOrders.length > 0 
        ? revenue / completedOrders.length 
        : 0;

      const ratedOrders = completedOrders.filter(o => o.rating);
      const averageRating = ratedOrders.length > 0
        ? ratedOrders.reduce((sum, o) => sum + o.rating, 0) / ratedOrders.length
        : 0;

      const stats = {
        vendorId: vendor._id,
        name: vendor.name,
        period,
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        pendingOrders: pendingOrders.length,
        revenue,
        averageOrderValue,
        averageRating,
        rating: vendor.rating,
        totalOrdersAllTime: vendor.totalOrders
      };

      logger.info('Retrieved vendor stats', { vendorId, period });
      return stats;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting vendor stats', { vendorId, error: error.message });
      throw error;
    }
  }

  async getVendorProducts(vendorId, availableOnly = true) {
    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      const products = await Product.findByVendor(vendorId, availableOnly);

      logger.info('Retrieved vendor products', { vendorId, count: products.length });
      return products;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting vendor products', { vendorId, error: error.message });
      throw error;
    }
  }

  async deleteVendor(vendorId) {
    try {
      logger.info('Deleting vendor', { vendorId });

      const vendor = await Vendor.findByIdAndDelete(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      logger.info('Vendor deleted successfully', { vendorId });
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deleting vendor', { vendorId, error: error.message });
      throw error;
    }
  }
}

module.exports = new VendorService();
