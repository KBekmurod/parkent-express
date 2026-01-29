const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { paginate, buildPaginationResponse, calculateDistance, calculateDeliveryFee, calculateETA } = require('../utils/helpers');
const { ORDER_STATUS } = require('../utils/constants');
const notificationService = require('./notificationService');

class OrderService {
  async createOrder(customerId, orderData) {
    const { vendorId, items, deliveryAddress, paymentMethod, notes } = orderData;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.isActive) {
      throw new Error('Vendor not found or inactive');
    }
    
    const canAccept = vendor.canAcceptOrder(0);
    if (!canAccept.canAccept) {
      throw new Error(canAccept.reason);
    }
    
    const orderItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product || !product.isAvailable) {
        throw new Error(`Product ${item.productId} not available`);
      }
      
      const availability = product.checkAvailability(item.quantity);
      if (!availability.available) {
        throw new Error(`${product.name}: ${availability.reason}`);
      }
      
      const itemSubtotal = product.price * item.quantity;
      
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        notes: item.notes || ''
      });
      
      subtotal += itemSubtotal;
      
      await product.decreaseStock(item.quantity);
    }
    
    const distance = calculateDistance(
      vendor.address.location.coordinates[1],
      vendor.address.location.coordinates[0],
      deliveryAddress.location.coordinates[1],
      deliveryAddress.location.coordinates[0]
    );
    
    const deliveryFee = calculateDeliveryFee(distance, vendor.settings.deliveryFee);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + serviceFee;
    
    const preparationTime = vendor.settings.preparationTime || 30;
    const estimatedDeliveryTime = new Date(Date.now() + calculateETA(distance, preparationTime) * 60000);
    
    const order = new Order({
      customer: customerId,
      vendor: vendorId,
      status: ORDER_STATUS.PENDING,
      items: orderItems,
      pricing: {
        subtotal,
        deliveryFee,
        serviceFee,
        discount: 0,
        total
      },
      deliveryAddress,
      paymentMethod,
      notes: {
        customer: notes || ''
      },
      estimatedDeliveryTime,
      preparationTime
    });
    
    await order.save();
    
    await order.populate(['customer', 'vendor', 'items.product']);
    
    await notificationService.notifyNewOrder(order);
    
    return order;
  }
  
  async getOrderById(orderId, userId, userRole) {
    const order = await Order.findById(orderId)
      .populate('customer', '-password')
      .populate('vendor')
      .populate('courier', '-password')
      .populate('items.product');
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (userRole !== 'admin') {
      const hasAccess = 
        order.customer._id.toString() === userId ||
        order.vendor.owner.toString() === userId ||
        (order.courier && order.courier._id.toString() === userId);
      
      if (!hasAccess) {
        throw new Error('Unauthorized access to order');
      }
    }
    
    return order;
  }
  
  async updateOrderStatus(orderId, newStatus, actorId, note = '') {
    const order = await Order.findById(orderId)
      .populate('customer')
      .populate('vendor')
      .populate('courier');
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (!order.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
    }
    
    order.status = newStatus;
    order.modifiedBy = actorId;
    
    if (note) {
      order.timeline[order.timeline.length - 1].note = note;
    }
    
    if (newStatus === ORDER_STATUS.DELIVERED) {
      order.actualDeliveryTime = new Date();
    }
    
    if (newStatus === ORDER_STATUS.CANCELLED) {
      order.cancelledBy = actorId;
      
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          await product.increaseStock(item.quantity);
        }
      }
    }
    
    await order.save();
    
    await notificationService.notifyOrderStatusChange(order);
    
    return order;
  }
  
  async confirmOrder(orderId, vendorId) {
    const order = await Order.findById(orderId).populate(['customer', 'vendor']);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.vendor._id.toString() !== vendorId) {
      throw new Error('Unauthorized');
    }
    
    return await this.updateOrderStatus(orderId, ORDER_STATUS.CONFIRMED, vendorId);
  }
  
  async rejectOrder(orderId, vendorId, reason) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.vendor.toString() !== vendorId) {
      throw new Error('Unauthorized');
    }
    
    order.cancellationReason = reason;
    await order.save();
    
    return await this.updateOrderStatus(orderId, ORDER_STATUS.REJECTED, vendorId, reason);
  }
  
  async assignCourier(orderId, courierId) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status !== ORDER_STATUS.READY) {
      throw new Error('Order must be ready before assigning courier');
    }
    
    order.courier = courierId;
    await order.save();
    
    const Courier = require('../models/Courier');
    const courier = await Courier.findOne({ user: courierId });
    
    if (courier) {
      await courier.assignOrder(orderId);
    }
    
    return await this.updateOrderStatus(orderId, ORDER_STATUS.ASSIGNED, courierId);
  }
  
  async cancelOrder(orderId, userId, reason) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (!order.canBeCancelled) {
      throw new Error('Order cannot be cancelled at this stage');
    }
    
    order.cancellationReason = reason;
    await order.save();
    
    return await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, userId, reason);
  }
  
  async listOrders(filters = {}, page = 1, limit = 10) {
    const { skip, limit: paginationLimit } = paginate(page, limit);
    
    const query = {};
    
    if (filters.customerId) {
      query.customer = filters.customerId;
    }
    
    if (filters.vendorId) {
      query.vendor = filters.vendorId;
    }
    
    if (filters.courierId) {
      query.courier = filters.courierId;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.isActive !== undefined) {
      if (filters.isActive) {
        query.status = { $in: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit'] };
      } else {
        query.status = { $in: ['delivered', 'cancelled', 'rejected'] };
      }
    }
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', '-password')
        .populate('vendor')
        .populate('courier', '-password')
        .skip(skip)
        .limit(paginationLimit)
        .sort({ createdAt: -1 }),
      Order.countDocuments(query)
    ]);
    
    return buildPaginationResponse(orders, total, page, paginationLimit);
  }
  
  async rateOrder(orderId, customerId, ratings) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.customer.toString() !== customerId) {
      throw new Error('Unauthorized');
    }
    
    if (order.status !== ORDER_STATUS.DELIVERED) {
      throw new Error('Can only rate delivered orders');
    }
    
    if (ratings.vendor) {
      order.rating.vendor = {
        score: ratings.vendor.score,
        comment: ratings.vendor.comment,
        timestamp: new Date()
      };
      
      const vendor = await Vendor.findById(order.vendor);
      if (vendor) {
        await vendor.updateRating(ratings.vendor.score);
      }
    }
    
    if (ratings.courier && order.courier) {
      order.rating.courier = {
        score: ratings.courier.score,
        comment: ratings.courier.comment,
        timestamp: new Date()
      };
      
      const Courier = require('../models/Courier');
      const courier = await Courier.findOne({ user: order.courier });
      if (courier) {
        await courier.updateRating(ratings.courier.score);
      }
    }
    
    await order.save();
    
    return order;
  }
  
  async getOrderStats(filters = {}) {
    const query = {};
    
    if (filters.vendorId) {
      query.vendor = filters.vendorId;
    }
    
    if (filters.courierId) {
      query.courier = filters.courierId;
    }
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }
    
    const stats = await Order.aggregate([
      { $match: query },
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
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$pricing.total', 0] }
          },
          averageOrderValue: {
            $avg: '$pricing.total'
          }
        }
      }
    ]);
    
    return stats[0] || {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  }
}

module.exports = new OrderService();
