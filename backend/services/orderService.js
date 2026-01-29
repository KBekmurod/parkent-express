const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Courier = require('../models/Courier');
const transactionService = require('./transactionService');
const courierService = require('./courierService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const { 
  NotFoundError, 
  ValidationError, 
  BadRequestError,
  ConflictError 
} = require('../utils/errorTypes');

class OrderService {
  async createOrder(orderData) {
    return await transactionService.executeWithTransaction(async (session) => {
      try {
        logger.info('Creating new order', { 
          customerId: orderData.customerId, 
          vendorId: orderData.vendorId 
        });

        const vendor = await Vendor.findById(orderData.vendorId).session(session);
        if (!vendor) {
          throw new NotFoundError('Vendor not found', 'Vendor');
        }

        if (!vendor.isActive || vendor.isPaused) {
          throw new BadRequestError('Vendor is not accepting orders');
        }

        if (!vendor.checkIfOpenNow()) {
          throw new BadRequestError('Vendor is currently closed');
        }

        const productIds = orderData.items.map(item => item.productId);
        const products = await Product.find({ 
          _id: { $in: productIds } 
        }).session(session);

        if (products.length !== orderData.items.length) {
          throw new NotFoundError('One or more products not found', 'Product');
        }

        const orderItems = orderData.items.map(item => {
          const product = products.find(p => p._id.toString() === item.productId.toString());
          
          if (!product.isAvailable) {
            throw new BadRequestError(`Product ${product.name} is not available`);
          }

          return {
            productId: product._id,
            productName: product.name,
            quantity: item.quantity,
            price: product.discountedPrice || product.price
          };
        });

        const orderNumber = await Order.generateOrderNumber();

        const newOrder = new Order({
          orderNumber,
          customerId: orderData.customerId,
          vendorId: orderData.vendorId,
          items: orderItems,
          deliveryLocation: orderData.deliveryLocation,
          orderDetails: orderData.orderDetails,
          paymentType: orderData.paymentType,
          deliveryFee: orderData.deliveryFee || 5000,
          status: 'pending'
        });

        newOrder.calculateTotal();
        await newOrder.save({ session });

        await Vendor.findByIdAndUpdate(
          orderData.vendorId,
          { $inc: { totalOrders: 1 } },
          { session }
        );

        for (const item of orderItems) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { soldCount: item.quantity } },
            { session }
          );
        }

        logger.info('Order created successfully', { 
          orderId: newOrder._id, 
          orderNumber: newOrder.orderNumber 
        });

        setImmediate(() => {
          notificationService.sendOrderNotification(newOrder, 'created').catch(err => {
            logger.error('Failed to send order creation notification', { error: err.message });
          });
        });

        return newOrder;
      } catch (error) {
        logger.error('Error creating order', { error: error.message, stack: error.stack });
        throw error;
      }
    });
  }

  async getOrderById(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('customerId', 'firstName lastName username phone')
        .populate('vendorId', 'name phone location')
        .populate('courierId');

      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      return order;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting order by ID', { orderId, error: error.message });
      throw error;
    }
  }

  async getOrderByNumber(orderNumber) {
    try {
      const order = await Order.findOne({ orderNumber })
        .populate('customerId', 'firstName lastName username phone')
        .populate('vendorId', 'name phone location')
        .populate('courierId');

      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      return order;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting order by number', { orderNumber, error: error.message });
      throw error;
    }
  }

  async updateOrderStatus(orderId, newStatus, updatedBy, note = null) {
    try {
      logger.info('Updating order status', { orderId, newStatus });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      await order.transitionStatus(newStatus, updatedBy, note);

      logger.info('Order status updated', { orderId, newStatus });

      setImmediate(() => {
        notificationService.sendOrderNotification(order, newStatus).catch(err => {
          logger.error('Failed to send status notification', { error: err.message });
        });
      });

      return order;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.message.includes('Cannot transition')) {
        throw new BadRequestError(error.message);
      }
      logger.error('Error updating order status', { orderId, error: error.message });
      throw error;
    }
  }

  async assignCourier(orderId, updatedBy) {
    return await transactionService.executeWithTransaction(async (session) => {
      try {
        logger.info('Assigning courier to order', { orderId });

        const order = await Order.findById(orderId)
          .populate('vendorId')
          .session(session);

        if (!order) {
          throw new NotFoundError('Order not found', 'Order');
        }

        if (order.status !== 'ready') {
          throw new BadRequestError('Order must be ready before assigning courier');
        }

        const courier = await courierService.findBestCourierForOrder(order);
        if (!courier) {
          throw new NotFoundError('No available courier found', 'Courier');
        }

        await courierService.assignOrderToCourier(courier._id, order._id);

        order.courierId = courier._id;
        await order.transitionStatus('assigned', updatedBy, `Courier ${courier._id} assigned`);

        logger.info('Courier assigned to order', { orderId, courierId: courier._id });

        setImmediate(() => {
          notificationService.sendCourierAssignedNotification(order, courier).catch(err => {
            logger.error('Failed to send courier assignment notification', { error: err.message });
          });
        });

        return order;
      } catch (error) {
        logger.error('Error assigning courier', { orderId, error: error.message });
        throw error;
      }
    });
  }

  async cancelOrder(orderId, cancelledBy, reason = null) {
    return await transactionService.executeWithTransaction(async (session) => {
      try {
        logger.info('Cancelling order', { orderId, reason });

        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new NotFoundError('Order not found', 'Order');
        }

        if (['delivered', 'cancelled'].includes(order.status)) {
          throw new BadRequestError(`Cannot cancel order with status: ${order.status}`);
        }

        if (order.courierId) {
          const courier = await Courier.findById(order.courierId).session(session);
          if (courier && courier.currentOrderId?.toString() === orderId.toString()) {
            courier.currentOrderId = null;
            courier.isAvailable = true;
            await courier.save({ session });
          }
        }

        order.cancellationReason = reason;
        await order.transitionStatus('cancelled', cancelledBy, reason);

        await Vendor.findByIdAndUpdate(
          order.vendorId,
          { $inc: { totalOrders: -1 } },
          { session }
        );

        logger.info('Order cancelled successfully', { orderId });

        setImmediate(() => {
          notificationService.sendOrderNotification(order, 'cancelled').catch(err => {
            logger.error('Failed to send cancellation notification', { error: err.message });
          });
        });

        return order;
      } catch (error) {
        logger.error('Error cancelling order', { orderId, error: error.message });
        throw error;
      }
    });
  }

  async completeOrder(orderId, completedBy) {
    return await transactionService.executeWithTransaction(async (session) => {
      try {
        logger.info('Completing order', { orderId });

        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new NotFoundError('Order not found', 'Order');
        }

        if (order.status !== 'in_transit') {
          throw new BadRequestError('Order must be in transit to complete');
        }

        await order.transitionStatus('delivered', completedBy, 'Order delivered');

        if (order.courierId) {
          const courier = await Courier.findById(order.courierId).session(session);
          if (courier) {
            await courierService.completeCourierOrder(courier._id, order.deliveryFee);
          }
        }

        logger.info('Order completed successfully', { orderId });

        setImmediate(() => {
          notificationService.sendOrderNotification(order, 'delivered').catch(err => {
            logger.error('Failed to send completion notification', { error: err.message });
          });
        });

        return order;
      } catch (error) {
        logger.error('Error completing order', { orderId, error: error.message });
        throw error;
      }
    });
  }

  async addOrderRating(orderId, rating, feedback = null) {
    try {
      logger.info('Adding order rating', { orderId, rating });

      if (rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      await order.addRating(rating, feedback);

      if (order.courierId) {
        await courierService.updateCourierRating(order.courierId, rating);
      }

      logger.info('Order rating added', { orderId, rating });
      return order;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Error adding order rating', { orderId, error: error.message });
      throw error;
    }
  }

  async getOrdersByStatus(status, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const query = { status };

      const orders = await Order.find(query)
        .populate('customerId', 'firstName lastName username phone')
        .populate('vendorId', 'name phone')
        .populate('courierId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(query);

      logger.info('Retrieved orders by status', { status, count: orders.length });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting orders by status', { status, error: error.message });
      throw error;
    }
  }

  async getOrdersByCustomer(customerId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const skip = (page - 1) * limit;

      const query = { customerId };
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('vendorId', 'name phone location imageUrl')
        .populate('courierId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(query);

      logger.info('Retrieved orders by customer', { customerId, count: orders.length });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting orders by customer', { customerId, error: error.message });
      throw error;
    }
  }

  async getOrdersByVendor(vendorId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const skip = (page - 1) * limit;

      const query = { vendorId };
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('customerId', 'firstName lastName username phone')
        .populate('courierId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(query);

      logger.info('Retrieved orders by vendor', { vendorId, count: orders.length });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting orders by vendor', { vendorId, error: error.message });
      throw error;
    }
  }

  async getOrdersByCourier(courierId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const skip = (page - 1) * limit;

      const query = { courierId };
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('customerId', 'firstName lastName phone')
        .populate('vendorId', 'name phone location')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(query);

      logger.info('Retrieved orders by courier', { courierId, count: orders.length });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting orders by courier', { courierId, error: error.message });
      throw error;
    }
  }

  async getOrderHistory(userId, userRole, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;

      let query;
      switch (userRole) {
        case 'customer':
          return this.getOrdersByCustomer(userId, options);
        case 'vendor':
          const vendor = await Vendor.findOne({ ownerId: userId });
          if (!vendor) {
            throw new NotFoundError('Vendor not found for user', 'Vendor');
          }
          return this.getOrdersByVendor(vendor._id, options);
        case 'courier':
          const courier = await Courier.findOne({ userId });
          if (!courier) {
            throw new NotFoundError('Courier not found for user', 'Courier');
          }
          return this.getOrdersByCourier(courier._id, options);
        case 'admin':
          return this.getAllOrders(options);
        default:
          throw new ValidationError(`Invalid user role: ${userRole}`);
      }
    } catch (error) {
      logger.error('Error getting order history', { userId, userRole, error: error.message });
      throw error;
    }
  }

  async getAllOrders(options = {}) {
    try {
      const { page = 1, limit = 20, status, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) {
        query.status = status;
      }
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const orders = await Order.find(query)
        .populate('customerId', 'firstName lastName username')
        .populate('vendorId', 'name')
        .populate('courierId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(query);

      logger.info('Retrieved all orders', { count: orders.length });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all orders', { error: error.message });
      throw error;
    }
  }

  async getActiveOrders(options = {}) {
    try {
      const activeStatuses = ['pending', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit'];
      
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const query = { status: { $in: activeStatuses } };

      const orders = await Order.find(query)
        .populate('customerId', 'firstName lastName phone')
        .populate('vendorId', 'name phone location')
        .populate('courierId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(query);

      logger.info('Retrieved active orders', { count: orders.length });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting active orders', { error: error.message });
      throw error;
    }
  }

  async deleteOrder(orderId) {
    try {
      logger.info('Deleting order', { orderId });

      const order = await Order.findByIdAndDelete(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      logger.info('Order deleted successfully', { orderId });
      return order;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deleting order', { orderId, error: error.message });
      throw error;
    }
  }
}

module.exports = new OrderService();
