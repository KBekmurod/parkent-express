const Order = require('../models/Order');
const User = require('../models/User');
const { ORDER_STATUS } = require('../config/constants');

/**
 * Order Service - Manages order operations
 */
class OrderService {
  /**
   * Create new order
   */
  async createOrder(orderData) {
    try {
      // Check if customer already has a pending order
      const existingOrder = await Order.findOne({
        customerId: orderData.customerId,
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED, ORDER_STATUS.DELIVERING] }
      });

      if (existingOrder) {
        throw new Error('ACTIVE_ORDER_EXISTS');
      }

      const order = new Order(orderData);
      await order.save();
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId) {
    try {
      return await Order.findById(orderId);
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  /**
   * Get customer's orders
   */
  async getCustomerOrders(customerId) {
    try {
      return await Order.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(10);
    } catch (error) {
      console.error('Error getting customer orders:', error);
      throw error;
    }
  }

  /**
   * Get pending orders (for couriers)
   */
  async getPendingOrders() {
    try {
      return await Order.find({ status: ORDER_STATUS.PENDING })
        .sort({ createdAt: 1 })
        .limit(10);
    } catch (error) {
      console.error('Error getting pending orders:', error);
      throw error;
    }
  }

  /**
   * Get courier's active orders
   */
  async getCourierActiveOrders(courierId) {
    try {
      return await Order.find({
        courierId,
        status: { $in: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.DELIVERING] }
      }).sort({ acceptedAt: 1 });
    } catch (error) {
      console.error('Error getting courier orders:', error);
      throw error;
    }
  }

  /**
   * Accept order by courier
   */
  async acceptOrder(orderId, courierId) {
    try {
      const order = await Order.findOneAndUpdate(
        { _id: orderId, status: ORDER_STATUS.PENDING },
        { 
          status: ORDER_STATUS.ACCEPTED,
          courierId,
          acceptedAt: new Date()
        },
        { new: true }
      );

      if (!order) {
        throw new Error('ORDER_NOT_AVAILABLE');
      }

      return order;
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, courierId = null) {
    try {
      const updateData = { status };
      
      if (status === ORDER_STATUS.DELIVERING) {
        // No additional fields needed
      } else if (status === ORDER_STATUS.DELIVERED) {
        updateData.deliveredAt = new Date();
        
        // Update courier statistics
        if (courierId) {
          const courier = await User.findOne({ telegramId: courierId, role: 'courier' });
          if (courier) {
            courier.resetDailyStats();
            courier.totalDeliveries += 1;
            courier.todayDeliveries += 1;
            await courier.save();
          }
        }
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      );

      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    try {
      // Actually delete the order as per requirements
      const order = await Order.findByIdAndDelete(orderId);
      return order;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Get all orders with optional filters (for admin)
   */
  async getAllOrders(filters = {}, limit = 20) {
    try {
      const query = {};
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.courierId) {
        query.courierId = filters.courierId;
      }
      
      if (filters.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query.createdAt = { $gte: startOfDay, $lte: endOfDay };
      }

      return await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(filters = {}) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = await Order.countDocuments({
        createdAt: { $gte: today },
        ...filters
      });

      const totalOrders = await Order.countDocuments(filters);

      const deliveredToday = await Order.countDocuments({
        status: ORDER_STATUS.DELIVERED,
        deliveredAt: { $gte: today },
        ...filters
      });

      const deliveredTotal = await Order.countDocuments({
        status: ORDER_STATUS.DELIVERED,
        ...filters
      });

      return {
        todayOrders,
        totalOrders,
        deliveredToday,
        deliveredTotal
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();
