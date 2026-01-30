const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const mongoose = require('mongoose');
const { paginate, buildPaginationResponse, calculateDistance, calculateDeliveryFee, calculateETA } = require('../utils/helpers');
const { ORDER_STATUS } = require('../utils/constants');
const notificationService = require('./notificationService');

class OrderService {
  async createOrder(customerId, orderData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { vendorId, items, deliveryAddress, paymentMethod, notes } = orderData;
      
      // 1. Check for existing active orders (with lock)
      const existingOrder = await Order.findOne({
        customer: customerId,
        status: { 
          $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT] 
        }
      }).session(session);

      if (existingOrder) {
        await session.abortTransaction();
        throw new Error('ACTIVE_ORDER_EXISTS');
      }
      
      const vendor = await Vendor.findById(vendorId).session(session);
      if (!vendor || !vendor.isActive) {
        await session.abortTransaction();
        throw new Error('Vendor not found or inactive');
      }
      
      const canAccept = vendor.canAcceptOrder(0);
      if (!canAccept.canAccept) {
        await session.abortTransaction();
        throw new Error(canAccept.reason);
      }
      
      const orderItems = [];
      let subtotal = 0;
      
      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);
        
        if (!product || !product.isAvailable) {
          await session.abortTransaction();
          throw new Error(`Product ${item.productId} not available`);
        }
        
        const availability = product.checkAvailability(item.quantity);
        if (!availability.available) {
          await session.abortTransaction();
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
        await product.save({ session });
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
      
      // 2. Create order atomically
      const orderDoc = new Order({
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
      
      await orderDoc.save({ session });
      
      // 3. Update customer order count
      await User.findOneAndUpdate(
        { _id: customerId },
        { 
          $inc: { totalOrders: 1 },
          $set: { lastOrderAt: new Date() }
        },
        { session, upsert: true }
      );
      
      // 4. Commit transaction
      await session.commitTransaction();
      console.log('✅ Order created successfully with transaction');
      
      await orderDoc.populate(['customer', 'vendor', 'items.product']);
      
      await notificationService.notifyNewOrder(orderDoc);
      
      return orderDoc;
    } catch (error) {
      // Rollback on any error
      await session.abortTransaction();
      console.error('❌ Order creation failed, transaction rolled back:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
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
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const order = await Order.findById(orderId)
        .populate('customer')
        .populate('vendor')
        .populate('courier')
        .session(session);
      
      if (!order) {
        await session.abortTransaction();
        throw new Error('Order not found');
      }
      
      if (!order.canTransitionTo(newStatus)) {
        await session.abortTransaction();
        throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
      }
      
      order.status = newStatus;
      order.modifiedBy = actorId;
      
      if (note) {
        order.timeline[order.timeline.length - 1].note = note;
      }
      
      if (newStatus === ORDER_STATUS.DELIVERED) {
        order.actualDeliveryTime = new Date();
        
        // Update courier statistics atomically
        if (order.courier) {
          const courier = await User.findById(order.courier._id).session(session);
          
          if (courier) {
            courier.resetDailyStats();
            await User.findByIdAndUpdate(
              courier._id,
              {
                $inc: {
                  totalDeliveries: 1,
                  todayDeliveries: 1,
                  activeOrders: -1
                },
                lastDeliveryReset: courier.lastDeliveryReset
              },
              { session }
            );
          }
        }
      }
      
      if (newStatus === ORDER_STATUS.CANCELLED) {
        order.cancelledBy = actorId;
        
        for (const item of order.items) {
          const product = await Product.findById(item.product).session(session);
          if (product) {
            await product.increaseStock(item.quantity);
            await product.save({ session });
          }
        }
        
        // If courier assigned, decrement their active orders
        if (order.courier) {
          await User.findByIdAndUpdate(
            order.courier._id,
            { $inc: { activeOrders: -1 } },
            { session }
          );
        }
      }
      
      await order.save({ session });
      
      await session.commitTransaction();
      console.log(`✅ Order ${orderId} status updated to ${newStatus}`);
      
      await notificationService.notifyOrderStatusChange(order);
      
      return order;
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Status update failed, transaction rolled back:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
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
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Try to assign courier (atomic operation)
      const order = await Order.findOneAndUpdate(
        { 
          _id: orderId, 
          status: ORDER_STATUS.READY // Only assign if still ready
        },
        { 
          courier: courierId
        },
        { new: true, session }
      );

      if (!order) {
        await session.abortTransaction();
        throw new Error('ORDER_NOT_AVAILABLE');
      }

      // 2. Update courier statistics
      await User.findOneAndUpdate(
        { _id: courierId, role: 'courier' },
        { 
          $inc: { activeOrders: 1 }
        },
        { session }
      );
      
      const Courier = require('../models/Courier');
      const courier = await Courier.findOne({ user: courierId }).session(session);
      
      if (courier) {
        await courier.assignOrder(orderId);
        await courier.save({ session });
      }
      
      // 3. Commit transaction
      await session.commitTransaction();
      console.log(`✅ Order ${orderId} assigned to courier ${courierId}`);
      
      return await this.updateOrderStatus(orderId, ORDER_STATUS.ASSIGNED, courierId);
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Courier assignment failed, transaction rolled back:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
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
