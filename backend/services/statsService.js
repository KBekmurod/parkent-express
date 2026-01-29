const Order = require('../models/Order');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Courier = require('../models/Courier');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errorTypes');

class StatsService {
  async getDashboardStats(period = 'today') {
    try {
      logger.info('Getting dashboard stats', { period });

      const dateRange = this.getDateRange(period);

      const [
        totalOrders,
        completedOrders,
        cancelledOrders,
        activeOrders,
        totalRevenue,
        totalUsers,
        activeVendors,
        activeCouriers,
        ordersByStatus
      ] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } }),
        Order.countDocuments({ 
          status: 'delivered', 
          createdAt: { $gte: dateRange.start, $lte: dateRange.end } 
        }),
        Order.countDocuments({ 
          status: 'cancelled', 
          createdAt: { $gte: dateRange.start, $lte: dateRange.end } 
        }),
        Order.countDocuments({ 
          status: { $nin: ['delivered', 'cancelled'] },
          createdAt: { $gte: dateRange.start, $lte: dateRange.end } 
        }),
        this.calculateRevenue(dateRange),
        User.countDocuments({ 
          registeredAt: { $gte: dateRange.start, $lte: dateRange.end } 
        }),
        Vendor.countDocuments({ isActive: true }),
        Courier.countDocuments({ isOnline: true, isAvailable: true }),
        this.getOrdersByStatus(dateRange)
      ]);

      const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

      const stats = {
        period,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          active: activeOrders,
          completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0,
          cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders * 100).toFixed(2) : 0
        },
        revenue: {
          total: totalRevenue,
          averageOrderValue
        },
        users: {
          newRegistrations: totalUsers,
          activeVendors,
          activeCouriers
        },
        ordersByStatus
      };

      logger.info('Dashboard stats retrieved', { period });
      return stats;
    } catch (error) {
      logger.error('Error getting dashboard stats', { period, error: error.message });
      throw error;
    }
  }

  async getVendorStats(vendorId, period = 'all') {
    try {
      logger.info('Getting vendor stats', { vendorId, period });

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      const dateRange = this.getDateRange(period);

      const orders = await Order.find({
        vendorId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      });

      const completedOrders = orders.filter(o => o.status === 'delivered');
      const cancelledOrders = orders.filter(o => o.status === 'cancelled');
      const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

      const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
      const deliveryFees = completedOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
      const netRevenue = revenue - deliveryFees;

      const averageOrderValue = completedOrders.length > 0 
        ? revenue / completedOrders.length 
        : 0;

      const ratedOrders = completedOrders.filter(o => o.rating);
      const averageRating = ratedOrders.length > 0
        ? ratedOrders.reduce((sum, o) => sum + o.rating, 0) / ratedOrders.length
        : 0;

      const topProducts = await this.getTopProductsByVendor(vendorId, dateRange, 5);

      const stats = {
        vendorId: vendor._id,
        vendorName: vendor.name,
        period,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        orders: {
          total: orders.length,
          completed: completedOrders.length,
          cancelled: cancelledOrders.length,
          active: activeOrders.length,
          completionRate: orders.length > 0 
            ? (completedOrders.length / orders.length * 100).toFixed(2) 
            : 0
        },
        revenue: {
          total: revenue,
          netRevenue,
          deliveryFees,
          averageOrderValue
        },
        rating: {
          average: averageRating.toFixed(2),
          totalRatings: ratedOrders.length,
          vendorRating: vendor.rating
        },
        topProducts,
        totalOrdersAllTime: vendor.totalOrders
      };

      logger.info('Vendor stats retrieved', { vendorId, period });
      return stats;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting vendor stats', { vendorId, error: error.message });
      throw error;
    }
  }

  async getCourierStats(courierId, period = 'all') {
    try {
      logger.info('Getting courier stats', { courierId, period });

      const courier = await Courier.findById(courierId).populate('userId');
      if (!courier) {
        throw new NotFoundError('Courier not found', 'Courier');
      }

      const dateRange = this.getDateRange(period);

      const orders = await Order.find({
        courierId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      });

      const completedOrders = orders.filter(o => o.status === 'delivered');
      const cancelledOrders = orders.filter(o => o.status === 'cancelled');
      const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

      const earnings = completedOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
      const averageEarningsPerOrder = completedOrders.length > 0 
        ? earnings / completedOrders.length 
        : 0;

      const ratedOrders = completedOrders.filter(o => o.rating);
      const averageRating = ratedOrders.length > 0
        ? ratedOrders.reduce((sum, o) => sum + o.rating, 0) / ratedOrders.length
        : 0;

      const totalDistance = await this.calculateTotalDistance(completedOrders);

      const stats = {
        courierId: courier._id,
        courierName: courier.userId?.firstName || 'N/A',
        period,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        deliveries: {
          total: orders.length,
          completed: completedOrders.length,
          cancelled: cancelledOrders.length,
          active: activeOrders.length,
          completionRate: orders.length > 0 
            ? (completedOrders.length / orders.length * 100).toFixed(2) 
            : 0
        },
        earnings: {
          total: earnings,
          averagePerOrder: averageEarningsPerOrder,
          todayEarnings: courier.stats.todayEarnings,
          totalEarningsAllTime: courier.stats.totalEarnings
        },
        rating: {
          average: averageRating.toFixed(2),
          totalRatings: ratedOrders.length,
          courierRating: courier.stats.rating
        },
        performance: {
          totalDistance: totalDistance.toFixed(2),
          todayDeliveries: courier.stats.todayDeliveries,
          totalDeliveriesAllTime: courier.stats.totalDeliveries
        },
        status: {
          isOnline: courier.isOnline,
          isAvailable: courier.isAvailable,
          currentOrder: courier.currentOrderId
        }
      };

      logger.info('Courier stats retrieved', { courierId, period });
      return stats;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting courier stats', { courierId, error: error.message });
      throw error;
    }
  }

  async getRevenueStats(period = 'month') {
    try {
      logger.info('Getting revenue stats', { period });

      const dateRange = this.getDateRange(period);

      const orders = await Order.find({
        status: 'delivered',
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      });

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalDeliveryFees = orders.reduce((sum, order) => sum + order.deliveryFee, 0);
      const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);

      const revenueByPaymentType = await Order.aggregate([
        {
          $match: {
            status: 'delivered',
            createdAt: { $gte: dateRange.start, $lte: dateRange.end }
          }
        },
        {
          $group: {
            _id: '$paymentType',
            count: { $sum: 1 },
            total: { $sum: '$total' }
          }
        }
      ]);

      const revenueByDay = await Order.aggregate([
        {
          $match: {
            status: 'delivered',
            createdAt: { $gte: dateRange.start, $lte: dateRange.end }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const topVendors = await this.getTopVendorsByRevenue(dateRange, 10);

      const stats = {
        period,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        revenue: {
          total: totalRevenue,
          subtotal: totalSubtotal,
          deliveryFees: totalDeliveryFees
        },
        orders: {
          count: orders.length,
          averageValue: orders.length > 0 ? totalRevenue / orders.length : 0
        },
        revenueByPaymentType,
        revenueByDay,
        topVendors
      };

      logger.info('Revenue stats retrieved', { period });
      return stats;
    } catch (error) {
      logger.error('Error getting revenue stats', { period, error: error.message });
      throw error;
    }
  }

  async getProductStats(options = {}) {
    try {
      logger.info('Getting product stats');

      const { limit = 10 } = options;

      const [
        topSellingProducts,
        mostViewedProducts,
        topRatedProducts,
        lowStockProducts
      ] = await Promise.all([
        Product.find({ isAvailable: true })
          .sort({ soldCount: -1 })
          .limit(limit)
          .populate('vendorId', 'name'),
        Product.find({ isAvailable: true })
          .sort({ viewCount: -1 })
          .limit(limit)
          .populate('vendorId', 'name'),
        Product.find({ isAvailable: true })
          .sort({ rating: -1 })
          .limit(limit)
          .populate('vendorId', 'name'),
        Product.find({ isAvailable: true, stock: { $lt: 10 } })
          .sort({ stock: 1 })
          .limit(limit)
          .populate('vendorId', 'name')
      ]);

      const totalProducts = await Product.countDocuments();
      const availableProducts = await Product.countDocuments({ isAvailable: true });

      const stats = {
        total: totalProducts,
        available: availableProducts,
        unavailable: totalProducts - availableProducts,
        topSelling: topSellingProducts,
        mostViewed: mostViewedProducts,
        topRated: topRatedProducts,
        lowStock: lowStockProducts
      };

      logger.info('Product stats retrieved');
      return stats;
    } catch (error) {
      logger.error('Error getting product stats', { error: error.message });
      throw error;
    }
  }

  async getUserStats() {
    try {
      logger.info('Getting user stats');

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });

      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            }
          }
        }
      ]);

      const recentUsers = await User.find()
        .sort({ registeredAt: -1 })
        .limit(10)
        .select('firstName lastName username role registeredAt');

      const stats = {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole,
        recent: recentUsers
      };

      logger.info('User stats retrieved');
      return stats;
    } catch (error) {
      logger.error('Error getting user stats', { error: error.message });
      throw error;
    }
  }

  getDateRange(period) {
    const now = new Date();
    let start;

    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        start = new Date(now.setDate(now.getDate() - 1));
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        start = new Date(0);
    }

    return {
      start,
      end: new Date()
    };
  }

  async calculateRevenue(dateRange) {
    const result = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async getOrdersByStatus(dateRange) {
    return await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
  }

  async getTopProductsByVendor(vendorId, dateRange, limit = 5) {
    const orders = await Order.find({
      vendorId,
      status: 'delivered',
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const productSales = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId.toString();
        if (!productSales[key]) {
          productSales[key] = {
            productId: item.productId,
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productSales[key].totalQuantity += item.quantity;
        productSales[key].totalRevenue += item.price * item.quantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  }

  async getTopVendorsByRevenue(dateRange, limit = 10) {
    return await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: '$vendorId',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          vendorId: '$_id',
          vendorName: '$vendor.name',
          orderCount: 1,
          totalRevenue: 1,
          averageOrderValue: { $divide: ['$totalRevenue', '$orderCount'] }
        }
      }
    ]);
  }

  async calculateTotalDistance(orders) {
    let totalDistance = 0;

    for (const order of orders) {
      if (order.vendorId?.location && order.deliveryLocation) {
        const distance = this.calculateDistance(
          order.vendorId.location.latitude,
          order.vendorId.location.longitude,
          order.deliveryLocation.latitude,
          order.deliveryLocation.longitude
        );
        totalDistance += distance;
      }
    }

    return totalDistance;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = new StatsService();
