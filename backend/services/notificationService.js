const { getBot } = require('../config/bot');
const { emitToUser, emitToRoom } = require('../config/socket');
const { createLogger } = require('../utils/logger');
const { NOTIFICATION_TYPES, SOCKET_EVENTS } = require('../utils/constants');
const { retry } = require('../utils/helpers');

const logger = createLogger('notification');

class NotificationService {
  async sendTelegramMessage(telegramId, message, options = {}) {
    try {
      const bot = getBot();
      
      const sendMessage = async () => {
        return await bot.sendMessage(telegramId, message, {
          parse_mode: 'HTML',
          ...options
        });
      };
      
      await retry(sendMessage, 3, 1000);
      
      logger.info(`Telegram message sent to ${telegramId}`);
      
    } catch (error) {
      logger.error(`Failed to send Telegram message to ${telegramId}:`, error);
      throw error;
    }
  }
  
  async sendSocketNotification(userId, type, data) {
    try {
      emitToUser(userId, SOCKET_EVENTS.NOTIFICATION, {
        type,
        data,
        timestamp: new Date()
      });
      
      logger.info(`Socket notification sent to user ${userId}`);
      
    } catch (error) {
      logger.error(`Failed to send socket notification to ${userId}:`, error);
    }
  }
  
  async notifyUser(userId, telegramId, message, type, data = {}) {
    const notifications = [];
    
    if (telegramId) {
      notifications.push(
        this.sendTelegramMessage(telegramId, message).catch(err => {
          logger.warn(`Telegram notification failed for user ${userId}:`, err);
        })
      );
    }
    
    if (userId) {
      notifications.push(
        this.sendSocketNotification(userId, type, data)
      );
    }
    
    await Promise.allSettled(notifications);
  }
  
  async notifyNewOrder(order) {
    const vendor = order.vendor;
    const vendorOwner = await require('../models/User').findById(vendor.owner);
    
    if (!vendorOwner) {
      return;
    }
    
    const message = `🆕 <b>New Order #${order.orderNumber}</b>\n\n` +
      `Customer: ${order.customer.firstName}\n` +
      `Items: ${order.items.length}\n` +
      `Total: ${order.pricing.total} UZS\n` +
      `Payment: ${order.paymentMethod}\n\n` +
      `Please confirm or reject this order.`;
    
    await this.notifyUser(
      vendorOwner._id,
      vendorOwner.telegramId,
      message,
      NOTIFICATION_TYPES.ORDER_CREATED,
      { orderId: order._id, orderNumber: order.orderNumber }
    );
    
    emitToRoom('vendors', SOCKET_EVENTS.NEW_ORDER, {
      order,
      vendorId: vendor._id
    });
  }
  
  async notifyOrderStatusChange(order) {
    const notifications = [];
    
    const customerMessage = this.getCustomerOrderMessage(order);
    if (customerMessage && order.customer) {
      notifications.push(
        this.notifyUser(
          order.customer._id,
          order.customer.telegramId,
          customerMessage,
          NOTIFICATION_TYPES[`ORDER_${order.status.toUpperCase()}`],
          { orderId: order._id, orderNumber: order.orderNumber, status: order.status }
        )
      );
    }
    
    if (order.courier && ['assigned', 'picked_up', 'in_transit'].includes(order.status)) {
      const courierMessage = this.getCourierOrderMessage(order);
      if (courierMessage) {
        notifications.push(
          this.notifyUser(
            order.courier._id,
            order.courier.telegramId,
            courierMessage,
            NOTIFICATION_TYPES[`ORDER_${order.status.toUpperCase()}`],
            { orderId: order._id, orderNumber: order.orderNumber, status: order.status }
          )
        );
      }
    }
    
    if (order.vendor) {
      const vendorOwner = await require('../models/User').findById(order.vendor.owner);
      if (vendorOwner) {
        const vendorMessage = this.getVendorOrderMessage(order);
        if (vendorMessage) {
          notifications.push(
            this.notifyUser(
              vendorOwner._id,
              vendorOwner.telegramId,
              vendorMessage,
              NOTIFICATION_TYPES[`ORDER_${order.status.toUpperCase()}`],
              { orderId: order._id, orderNumber: order.orderNumber, status: order.status }
            )
          );
        }
      }
    }
    
    await Promise.allSettled(notifications);
    
    emitToRoom(`order:${order._id}`, SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      timestamp: new Date()
    });
  }
  
  getCustomerOrderMessage(order) {
    const statusMessages = {
      'confirmed': `✅ <b>Order Confirmed #${order.orderNumber}</b>\n\nYour order has been confirmed and is being prepared.\nEstimated delivery: ${order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}`,
      'preparing': `👨‍🍳 <b>Order Preparing #${order.orderNumber}</b>\n\nYour order is being prepared by ${order.vendor.name}.`,
      'ready': `✅ <b>Order Ready #${order.orderNumber}</b>\n\nYour order is ready and waiting for courier pickup.`,
      'assigned': `🚴 <b>Courier Assigned #${order.orderNumber}</b>\n\nA courier has been assigned to deliver your order.`,
      'picked_up': `📦 <b>Order Picked Up #${order.orderNumber}</b>\n\nYour order has been picked up and is on the way!`,
      'in_transit': `🚚 <b>Order In Transit #${order.orderNumber}</b>\n\nYour order is on the way to you!`,
      'delivered': `✅ <b>Order Delivered #${order.orderNumber}</b>\n\nYour order has been delivered. Enjoy!\n\nPlease rate your experience.`,
      'cancelled': `❌ <b>Order Cancelled #${order.orderNumber}</b>\n\n${order.cancellationReason || 'Your order has been cancelled.'}`,
      'rejected': `❌ <b>Order Rejected #${order.orderNumber}</b>\n\n${order.cancellationReason || 'Your order has been rejected by the vendor.'}`
    };
    
    return statusMessages[order.status];
  }
  
  getCourierOrderMessage(order) {
    const statusMessages = {
      'assigned': `📦 <b>New Delivery Assignment #${order.orderNumber}</b>\n\nPickup: ${order.vendor.name}\nDeliver to: ${order.deliveryAddress.street}\nPayment: ${order.paymentMethod}\nTotal: ${order.pricing.total} UZS`,
      'picked_up': `✅ Order #${order.orderNumber} picked up. Navigate to customer location.`,
      'in_transit': `🚚 Delivery in progress for order #${order.orderNumber}.`
    };
    
    return statusMessages[order.status];
  }
  
  getVendorOrderMessage(order) {
    const statusMessages = {
      'picked_up': `📦 <b>Order Picked Up #${order.orderNumber}</b>\n\nCourier has picked up the order.`,
      'delivered': `✅ <b>Order Delivered #${order.orderNumber}</b>\n\nOrder has been successfully delivered to customer.`,
      'cancelled': `❌ <b>Order Cancelled #${order.orderNumber}</b>\n\nOrder #${order.orderNumber} has been cancelled.`
    };
    
    return statusMessages[order.status];
  }
  
  async notifyAvailableCouriers(order, couriers) {
    const message = `🆕 <b>New Delivery Available!</b>\n\n` +
      `Order: #${order.orderNumber}\n` +
      `Pickup: ${order.vendor.name}\n` +
      `Delivery: ${order.deliveryAddress.street}\n` +
      `Payment: ${order.paymentMethod}\n` +
      `Total: ${order.pricing.total} UZS\n\n` +
      `Accept this delivery?`;
    
    const notifications = couriers.map(courier =>
      this.notifyUser(
        courier.user._id,
        courier.user.telegramId,
        message,
        NOTIFICATION_TYPES.NEW_ORDER_AVAILABLE,
        { orderId: order._id, orderNumber: order.orderNumber }
      ).catch(err => {
        logger.warn(`Failed to notify courier ${courier._id}:`, err);
      })
    );
    
    await Promise.allSettled(notifications);
  }
  
  async notifyCourierLocationUpdate(courierId, orderId, location) {
    emitToRoom(`order:${orderId}`, SOCKET_EVENTS.COURIER_LOCATION_UPDATED, {
      courierId,
      orderId,
      location,
      timestamp: new Date()
    });
  }
  
  async sendBulkNotification(userIds, message, type = 'notification') {
    const notifications = userIds.map(async (userId) => {
      const user = await require('../models/User').findById(userId);
      if (user && user.isActive) {
        return this.notifyUser(user._id, user.telegramId, message, type);
      }
    });
    
    const results = await Promise.allSettled(notifications);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return { successful, failed, total: userIds.length };
  }
}

module.exports = new NotificationService();
