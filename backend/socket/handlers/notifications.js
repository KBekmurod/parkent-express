const logger = require('../../utils/logger');
const { NOTIFICATION_TYPES } = require('../../config/constants');

/**
 * Real-time notification handlers for Socket.io
 * Manages push notifications to users, roles, and system-wide broadcasts
 */

/**
 * Send notification to a specific user
 * @param {Object} io - Socket.io server instance
 * @param {String} userId - Target user ID
 * @param {Object} notification - Notification data
 */
function sendNotificationToUser(io, userId, notification) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!notification) {
      throw new Error('Notification data is required');
    }

    if (!notification.type) {
      throw new Error('Notification type is required');
    }

    if (!notification.message && !notification.title) {
      throw new Error('Notification must have a message or title');
    }

    const payload = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type,
      title: notification.title || 'Notification',
      message: notification.message,
      data: notification.data || {},
      priority: notification.priority || 'normal',
      actionUrl: notification.actionUrl || null,
      actionText: notification.actionText || null,
      icon: notification.icon || null,
      image: notification.image || null,
      read: false,
      createdAt: notification.createdAt || new Date(),
      timestamp: new Date()
    };

    // Emit to user's personal room
    io.to(`user:${userId}`).emit('notification', payload);

    logger.info('Notification sent to user', {
      userId,
      notificationId: payload.id,
      type: payload.type,
      title: payload.title
    });

    return true;
  } catch (error) {
    logger.error('Error sending notification to user', {
      error: error.message,
      stack: error.stack,
      userId,
      notification
    });
    return false;
  }
}

/**
 * Send notification to all users with a specific role
 * @param {Object} io - Socket.io server instance
 * @param {String} role - Target role (admin, vendor, courier, customer)
 * @param {Object} notification - Notification data
 */
function sendNotificationToRole(io, role, notification) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!role) {
      throw new Error('Role is required');
    }

    if (!notification) {
      throw new Error('Notification data is required');
    }

    const validRoles = ['admin', 'vendor', 'courier', 'customer'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    }

    if (!notification.type) {
      throw new Error('Notification type is required');
    }

    if (!notification.message && !notification.title) {
      throw new Error('Notification must have a message or title');
    }

    const payload = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type,
      title: notification.title || 'Notification',
      message: notification.message,
      data: notification.data || {},
      priority: notification.priority || 'normal',
      targetRole: role,
      actionUrl: notification.actionUrl || null,
      actionText: notification.actionText || null,
      icon: notification.icon || null,
      image: notification.image || null,
      read: false,
      createdAt: notification.createdAt || new Date(),
      timestamp: new Date()
    };

    // Emit to role-specific room
    io.to(`role:${role}`).emit('notification', payload);

    logger.info('Notification sent to role', {
      role,
      notificationId: payload.id,
      type: payload.type,
      title: payload.title
    });

    return true;
  } catch (error) {
    logger.error('Error sending notification to role', {
      error: error.message,
      stack: error.stack,
      role,
      notification
    });
    return false;
  }
}

/**
 * Broadcast system notification to all connected users
 * @param {Object} io - Socket.io server instance
 * @param {Object} notification - Notification data
 */
function broadcastSystemNotification(io, notification) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!notification) {
      throw new Error('Notification data is required');
    }

    if (!notification.message && !notification.title) {
      throw new Error('Notification must have a message or title');
    }

    const payload = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type || 'system',
      title: notification.title || 'System Notification',
      message: notification.message,
      data: notification.data || {},
      priority: notification.priority || 'high',
      actionUrl: notification.actionUrl || null,
      actionText: notification.actionText || null,
      icon: notification.icon || null,
      image: notification.image || null,
      isSystemWide: true,
      read: false,
      createdAt: notification.createdAt || new Date(),
      timestamp: new Date()
    };

    // Broadcast to all connected clients
    io.emit('notification:system', payload);

    logger.info('System notification broadcasted', {
      notificationId: payload.id,
      type: payload.type,
      title: payload.title,
      priority: payload.priority
    });

    return true;
  } catch (error) {
    logger.error('Error broadcasting system notification', {
      error: error.message,
      stack: error.stack,
      notification
    });
    return false;
  }
}

/**
 * Send order-related notification
 * @param {Object} io - Socket.io server instance
 * @param {String} userId - Target user ID
 * @param {String} orderId - Related order ID
 * @param {String} type - Notification type
 * @param {Object} data - Additional notification data
 */
function sendOrderNotification(io, userId, orderId, type, data = {}) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!type) {
      throw new Error('Notification type is required');
    }

    // Generate notification message based on type
    let title = 'Order Update';
    let message = '';

    switch (type) {
      case NOTIFICATION_TYPES.ORDER_CREATED:
        title = 'New Order Created';
        message = `Your order #${data.orderNumber || orderId} has been created successfully`;
        break;
      case NOTIFICATION_TYPES.ORDER_ACCEPTED:
        title = 'Order Accepted';
        message = `Your order #${data.orderNumber || orderId} has been accepted`;
        break;
      case NOTIFICATION_TYPES.ORDER_PREPARING:
        title = 'Order Being Prepared';
        message = `Your order #${data.orderNumber || orderId} is being prepared`;
        break;
      case NOTIFICATION_TYPES.ORDER_READY:
        title = 'Order Ready';
        message = `Your order #${data.orderNumber || orderId} is ready for pickup`;
        break;
      case NOTIFICATION_TYPES.ORDER_ASSIGNED:
        title = 'Courier Assigned';
        message = `A courier has been assigned to your order #${data.orderNumber || orderId}`;
        break;
      case NOTIFICATION_TYPES.ORDER_PICKED_UP:
        title = 'Order Picked Up';
        message = `Your order #${data.orderNumber || orderId} has been picked up by courier`;
        break;
      case NOTIFICATION_TYPES.ORDER_DELIVERING:
        title = 'Order On The Way';
        message = `Your order #${data.orderNumber || orderId} is on the way`;
        break;
      case NOTIFICATION_TYPES.ORDER_COMPLETED:
        title = 'Order Delivered';
        message = `Your order #${data.orderNumber || orderId} has been delivered successfully`;
        break;
      case NOTIFICATION_TYPES.ORDER_CANCELLED:
        title = 'Order Cancelled';
        message = `Your order #${data.orderNumber || orderId} has been cancelled`;
        break;
      default:
        message = `Order #${data.orderNumber || orderId} has been updated`;
    }

    // Override with custom message if provided
    if (data.message) {
      message = data.message;
    }

    if (data.title) {
      title = data.title;
    }

    const notification = {
      type,
      title,
      message,
      data: {
        orderId,
        orderNumber: data.orderNumber,
        ...data
      },
      actionUrl: `/orders/${orderId}`,
      actionText: 'View Order',
      icon: 'order',
      priority: data.priority || 'normal'
    };

    return sendNotificationToUser(io, userId, notification);
  } catch (error) {
    logger.error('Error sending order notification', {
      error: error.message,
      stack: error.stack,
      userId,
      orderId,
      type
    });
    return false;
  }
}

/**
 * Send payment notification
 * @param {Object} io - Socket.io server instance
 * @param {String} userId - Target user ID
 * @param {String} orderId - Related order ID
 * @param {Object} paymentData - Payment information
 */
function sendPaymentNotification(io, userId, orderId, paymentData) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!paymentData) {
      throw new Error('Payment data is required');
    }

    const notification = {
      type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `Payment of ${paymentData.amount} ${paymentData.currency || 'UZS'} received for order #${paymentData.orderNumber || orderId}`,
      data: {
        orderId,
        orderNumber: paymentData.orderNumber,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentType: paymentData.paymentType,
        paymentStatus: paymentData.status
      },
      actionUrl: `/orders/${orderId}`,
      actionText: 'View Order',
      icon: 'payment',
      priority: 'high'
    };

    return sendNotificationToUser(io, userId, notification);
  } catch (error) {
    logger.error('Error sending payment notification', {
      error: error.message,
      stack: error.stack,
      userId,
      orderId,
      paymentData
    });
    return false;
  }
}

/**
 * Send notification to multiple users
 * @param {Object} io - Socket.io server instance
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notification - Notification data
 */
function sendNotificationToMultipleUsers(io, userIds, notification) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required and must not be empty');
    }

    if (!notification) {
      throw new Error('Notification data is required');
    }

    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      const result = sendNotificationToUser(io, userId, notification);
      if (result) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    logger.info('Notification sent to multiple users', {
      totalUsers: userIds.length,
      successCount,
      failureCount,
      type: notification.type
    });

    return { successCount, failureCount, total: userIds.length };
  } catch (error) {
    logger.error('Error sending notification to multiple users', {
      error: error.message,
      stack: error.stack,
      userIds,
      notification
    });
    return { successCount: 0, failureCount: userIds?.length || 0, total: userIds?.length || 0 };
  }
}

module.exports = {
  sendNotificationToUser,
  sendNotificationToRole,
  broadcastSystemNotification,
  sendOrderNotification,
  sendPaymentNotification,
  sendNotificationToMultipleUsers
};
