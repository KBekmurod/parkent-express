const logger = require('../../utils/logger');
const { SOCKET_EVENTS, ORDER_STATUSES } = require('../../config/constants');

/**
 * Order update event handlers for real-time notifications
 */

/**
 * Emit new order creation to admin room
 * Notifies admins and vendors about new orders
 * @param {Object} io - Socket.io server instance
 * @param {Object} orderData - Order data
 */
function emitNewOrder(io, orderData) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!orderData) {
      throw new Error('Order data is required');
    }

    if (!orderData._id && !orderData.id) {
      throw new Error('Order ID is required');
    }

    const payload = {
      orderId: orderData._id || orderData.id,
      orderNumber: orderData.orderNumber,
      customer: {
        id: orderData.customer?._id || orderData.customer?.id || orderData.customerId,
        name: orderData.customer?.username || orderData.customerName,
        phone: orderData.customer?.phone || orderData.deliveryAddress?.phone
      },
      vendor: {
        id: orderData.vendor?._id || orderData.vendor?.id || orderData.vendorId,
        name: orderData.vendor?.name || orderData.vendorName
      },
      items: orderData.items || [],
      totalAmount: orderData.totalAmount,
      deliveryAddress: orderData.deliveryAddress,
      status: orderData.status,
      paymentType: orderData.paymentType,
      createdAt: orderData.createdAt || new Date(),
      timestamp: new Date()
    };

    // Emit to admin room
    io.to('admin').emit(SOCKET_EVENTS.ORDER_NEW, payload);

    // Emit to all admins
    io.to('role:admin').emit(SOCKET_EVENTS.ORDER_NEW, payload);

    // Emit to specific vendor if vendor ID exists
    if (payload.vendor.id) {
      io.to(`vendor:${payload.vendor.id}`).emit(SOCKET_EVENTS.ORDER_NEW, payload);
      io.to(`user:${payload.vendor.id}`).emit(SOCKET_EVENTS.ORDER_NEW, payload);
    }

    // Emit to vendor role
    io.to('role:vendor').emit(SOCKET_EVENTS.ORDER_NEW, payload);

    logger.info('New order emitted', {
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      customerId: payload.customer.id,
      vendorId: payload.vendor.id,
      totalAmount: payload.totalAmount
    });

    return true;
  } catch (error) {
    logger.error('Error emitting new order', {
      error: error.message,
      stack: error.stack,
      orderData
    });
    return false;
  }
}

/**
 * Emit order update to order room and admin
 * Notifies all parties involved in the order about updates
 * @param {Object} io - Socket.io server instance
 * @param {Object} orderData - Updated order data
 */
function emitOrderUpdated(io, orderData) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!orderData) {
      throw new Error('Order data is required');
    }

    const orderId = orderData._id || orderData.id;
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const payload = {
      orderId,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      customer: {
        id: orderData.customer?._id || orderData.customer?.id || orderData.customerId,
        name: orderData.customer?.username || orderData.customerName
      },
      vendor: {
        id: orderData.vendor?._id || orderData.vendor?.id || orderData.vendorId,
        name: orderData.vendor?.name || orderData.vendorName
      },
      courier: orderData.courier ? {
        id: orderData.courier._id || orderData.courier.id || orderData.courierId,
        name: orderData.courier.username || orderData.courierName,
        phone: orderData.courier.phone
      } : null,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      deliveryAddress: orderData.deliveryAddress,
      estimatedDeliveryTime: orderData.estimatedDeliveryTime,
      updatedAt: orderData.updatedAt || new Date(),
      timestamp: new Date()
    };

    // Emit to order-specific room
    io.to(`order:${orderId}`).emit(SOCKET_EVENTS.ORDER_UPDATE, payload);

    // Emit to admin room
    io.to('admin').emit(SOCKET_EVENTS.ORDER_UPDATE, payload);
    io.to('role:admin').emit(SOCKET_EVENTS.ORDER_UPDATE, payload);

    // Emit to customer
    if (payload.customer.id) {
      io.to(`user:${payload.customer.id}`).emit(SOCKET_EVENTS.ORDER_UPDATE, payload);
    }

    // Emit to vendor
    if (payload.vendor.id) {
      io.to(`user:${payload.vendor.id}`).emit(SOCKET_EVENTS.ORDER_UPDATE, payload);
      io.to(`vendor:${payload.vendor.id}`).emit(SOCKET_EVENTS.ORDER_UPDATE, payload);
    }

    // Emit to courier if assigned
    if (payload.courier && payload.courier.id) {
      io.to(`user:${payload.courier.id}`).emit(SOCKET_EVENTS.ORDER_UPDATE, payload);
    }

    logger.info('Order update emitted', {
      orderId,
      orderNumber: payload.orderNumber,
      status: payload.status,
      customerId: payload.customer.id,
      vendorId: payload.vendor.id,
      courierId: payload.courier?.id
    });

    return true;
  } catch (error) {
    logger.error('Error emitting order update', {
      error: error.message,
      stack: error.stack,
      orderData
    });
    return false;
  }
}

/**
 * Emit order cancellation to all related parties
 * @param {Object} io - Socket.io server instance
 * @param {Object} orderData - Cancelled order data
 */
function emitOrderCancelled(io, orderData) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!orderData) {
      throw new Error('Order data is required');
    }

    const orderId = orderData._id || orderData.id;
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const payload = {
      orderId,
      orderNumber: orderData.orderNumber,
      status: ORDER_STATUSES.CANCELLED,
      customer: {
        id: orderData.customer?._id || orderData.customer?.id || orderData.customerId,
        name: orderData.customer?.username || orderData.customerName
      },
      vendor: {
        id: orderData.vendor?._id || orderData.vendor?.id || orderData.vendorId,
        name: orderData.vendor?.name || orderData.vendorName
      },
      courier: orderData.courier ? {
        id: orderData.courier._id || orderData.courier.id || orderData.courierId,
        name: orderData.courier.username || orderData.courierName
      } : null,
      cancellationReason: orderData.cancellationReason || 'No reason provided',
      cancelledBy: orderData.cancelledBy,
      cancelledAt: orderData.cancelledAt || new Date(),
      timestamp: new Date()
    };

    // Emit to order-specific room
    io.to(`order:${orderId}`).emit('order:cancelled', payload);

    // Emit to admin room
    io.to('admin').emit('order:cancelled', payload);
    io.to('role:admin').emit('order:cancelled', payload);

    // Emit to customer
    if (payload.customer.id) {
      io.to(`user:${payload.customer.id}`).emit('order:cancelled', payload);
    }

    // Emit to vendor
    if (payload.vendor.id) {
      io.to(`user:${payload.vendor.id}`).emit('order:cancelled', payload);
      io.to(`vendor:${payload.vendor.id}`).emit('order:cancelled', payload);
    }

    // Emit to courier if assigned
    if (payload.courier && payload.courier.id) {
      io.to(`user:${payload.courier.id}`).emit('order:cancelled', payload);
    }

    logger.info('Order cancellation emitted', {
      orderId,
      orderNumber: payload.orderNumber,
      cancelledBy: payload.cancelledBy,
      reason: payload.cancellationReason,
      customerId: payload.customer.id,
      vendorId: payload.vendor.id,
      courierId: payload.courier?.id
    });

    return true;
  } catch (error) {
    logger.error('Error emitting order cancellation', {
      error: error.message,
      stack: error.stack,
      orderData
    });
    return false;
  }
}

/**
 * Emit order status change to order room
 * @param {Object} io - Socket.io server instance
 * @param {String} orderId - Order ID
 * @param {String} status - New order status
 * @param {Object} additionalData - Additional data to include
 */
function emitStatusChanged(io, orderId, status, additionalData = {}) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!status) {
      throw new Error('Status is required');
    }

    // Validate status
    const validStatuses = Object.values(ORDER_STATUSES);
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const payload = {
      orderId,
      status,
      previousStatus: additionalData.previousStatus,
      message: additionalData.message || `Order status changed to ${status}`,
      updatedBy: additionalData.updatedBy,
      estimatedDeliveryTime: additionalData.estimatedDeliveryTime,
      timestamp: new Date(),
      ...additionalData
    };

    // Emit to order-specific room
    io.to(`order:${orderId}`).emit('order:status:changed', payload);

    // Emit to admin room
    io.to('admin').emit('order:status:changed', payload);
    io.to('role:admin').emit('order:status:changed', payload);

    logger.info('Order status change emitted', {
      orderId,
      status,
      previousStatus: payload.previousStatus,
      updatedBy: payload.updatedBy
    });

    return true;
  } catch (error) {
    logger.error('Error emitting status change', {
      error: error.message,
      stack: error.stack,
      orderId,
      status
    });
    return false;
  }
}

/**
 * Emit courier assignment notification
 * @param {Object} io - Socket.io server instance
 * @param {String} orderId - Order ID
 * @param {Object} courierData - Courier data
 */
function emitCourierAssigned(io, orderId, courierData) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!courierData) {
      throw new Error('Courier data is required');
    }

    const payload = {
      orderId,
      courier: {
        id: courierData._id || courierData.id,
        name: courierData.username || courierData.name,
        phone: courierData.phone,
        rating: courierData.rating
      },
      status: ORDER_STATUSES.ASSIGNED,
      timestamp: new Date()
    };

    // Emit to order room
    io.to(`order:${orderId}`).emit(SOCKET_EVENTS.ORDER_ASSIGNED, payload);

    // Emit to courier
    io.to(`user:${payload.courier.id}`).emit(SOCKET_EVENTS.ORDER_ASSIGNED, payload);

    // Emit to admin room
    io.to('admin').emit(SOCKET_EVENTS.ORDER_ASSIGNED, payload);

    logger.info('Courier assignment emitted', {
      orderId,
      courierId: payload.courier.id,
      courierName: payload.courier.name
    });

    return true;
  } catch (error) {
    logger.error('Error emitting courier assignment', {
      error: error.message,
      stack: error.stack,
      orderId,
      courierData
    });
    return false;
  }
}

module.exports = {
  emitNewOrder,
  emitOrderUpdated,
  emitOrderCancelled,
  emitStatusChanged,
  emitCourierAssigned
};
