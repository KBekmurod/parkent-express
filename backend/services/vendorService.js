const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { paginate, buildPaginationResponse, calculateDistance } = require('../utils/helpers');
const { VENDOR_CATEGORIES } = require('../utils/constants');

class VendorService {
  async createVendor(ownerId, vendorData) {
    const owner = await User.findById(ownerId);
    
    if (!owner) {
      throw new Error('Owner not found');
    }
    
    if (owner.role !== 'vendor' && owner.role !== 'admin') {
      throw new Error('User must have vendor role');
    }
    
    const existingVendor = await Vendor.findOne({ owner: ownerId, isActive: true });
    
    if (existingVendor) {
      throw new Error('User already has an active vendor');
    }
    
    const vendor = new Vendor({
      ...vendorData,
      owner: ownerId
    });
    
    await vendor.save();
    
    return vendor;
  }
  
  async getVendorById(vendorId) {
    const vendor = await Vendor.findById(vendorId)
      .populate('owner', '-password');
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    return vendor;
  }
  
  async updateVendor(vendorId, ownerId, updates) {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    if (vendor.owner.toString() !== ownerId) {
      throw new Error('Unauthorized');
    }
    
    const allowedUpdates = [
      'name',
      'description',
      'category',
      'images',
      'logo',
      'address',
      'contact',
      'workingHours',
      'settings',
      'tags'
    ];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        vendor[key] = updates[key];
      }
    });
    
    await vendor.save();
    
    return vendor;
  }
  
  async toggleVendorStatus(vendorId, ownerId, isActive) {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    if (vendor.owner.toString() !== ownerId) {
      throw new Error('Unauthorized');
    }
    
    vendor.isActive = isActive;
    await vendor.save();
    
    return vendor;
  }
  
  async toggleAcceptOrders(vendorId, ownerId, acceptsOrders) {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    if (vendor.owner.toString() !== ownerId) {
      throw new Error('Unauthorized');
    }
    
    vendor.settings.acceptsOrders = acceptsOrders;
    await vendor.save();
    
    return vendor;
  }
  
  async listVendors(filters = {}, page = 1, limit = 10) {
    const { skip, limit: paginationLimit } = paginate(page, limit);
    
    const query = { isActive: true };
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }
    
    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    
    let queryBuilder = Vendor.find(query)
      .populate('owner', 'firstName lastName phone')
      .skip(skip)
      .limit(paginationLimit);
    
    if (filters.search) {
      queryBuilder = queryBuilder.sort({ score: { $meta: 'textScore' } });
    } else if (filters.sortBy === 'rating') {
      queryBuilder = queryBuilder.sort({ 'rating.average': -1 });
    } else if (filters.sortBy === 'orders') {
      queryBuilder = queryBuilder.sort({ 'stats.totalOrders': -1 });
    } else {
      queryBuilder = queryBuilder.sort({ isFeatured: -1, 'rating.average': -1, createdAt: -1 });
    }
    
    const [vendors, total] = await Promise.all([
      queryBuilder,
      Vendor.countDocuments(query)
    ]);
    
    return buildPaginationResponse(vendors, total, page, paginationLimit);
  }
  
  async findNearbyVendors(longitude, latitude, maxDistanceKm = 10, filters = {}) {
    const query = {
      isActive: true,
      'address.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceKm * 1000
        }
      }
    };
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }
    
    const vendors = await Vendor.find(query)
      .populate('owner', 'firstName lastName phone')
      .limit(filters.limit || 20);
    
    const vendorsWithDistance = vendors.map(vendor => {
      const distance = calculateDistance(
        latitude,
        longitude,
        vendor.address.location.coordinates[1],
        vendor.address.location.coordinates[0]
      );
      
      return {
        ...vendor.toObject(),
        distance: parseFloat(distance.toFixed(2))
      };
    });
    
    return vendorsWithDistance.sort((a, b) => a.distance - b.distance);
  }
  
  async getVendorStats(vendorId, ownerId) {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    if (vendor.owner.toString() !== ownerId) {
      throw new Error('Unauthorized');
    }
    
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    
    const [orderStats, productCount] = await Promise.all([
      Order.aggregate([
        { $match: { vendor: vendor._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $in: ['$status', ['cancelled', 'rejected']] }, 1, 0] }
            },
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$pricing.subtotal', 0] }
            },
            averageOrderValue: {
              $avg: '$pricing.subtotal'
            }
          }
        }
      ]),
      Product.countDocuments({ vendor: vendor._id, isAvailable: true })
    ]);
    
    return {
      vendor,
      stats: {
        ...(orderStats[0] || {
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        }),
        activeProducts: productCount
      }
    };
  }
  
  async verifyVendor(vendorId, adminId) {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    vendor.isVerified = true;
    vendor.metadata.verifiedAt = new Date();
    vendor.metadata.verifiedBy = adminId;
    
    await vendor.save();
    
    return vendor;
  }
  
  async suspendVendor(vendorId, adminId, reason) {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    vendor.isActive = false;
    vendor.metadata.suspendedAt = new Date();
    vendor.metadata.suspendedBy = adminId;
    vendor.metadata.suspensionReason = reason;
    
    await vendor.save();
    
    return vendor;
  }
  
  async deleteVendor(vendorId, ownerId) {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    if (vendor.owner.toString() !== ownerId) {
      throw new Error('Unauthorized');
    }
    
    const Order = require('../models/Order');
    const activeOrders = await Order.countDocuments({
      vendor: vendorId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit'] }
    });
    
    if (activeOrders > 0) {
      throw new Error('Cannot delete vendor with active orders');
    }
    
    vendor.isActive = false;
    await vendor.save();
    
    return { message: 'Vendor deleted successfully' };
  }
}

module.exports = new VendorService();
