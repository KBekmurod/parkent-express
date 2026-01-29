const botConfig = require('../config/bot');
const User = require('../models/User');
const logger = require('../utils/logger');

class NotificationService {
  async sendNotification(userId, message, options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.warn('User not found for notification', { userId });
        return false;
      }

      if (!botConfig.isInitialized()) {
        logger.warn('Bot not initialized, skipping notification');
        return false;
      }

      await botConfig.sendMessage(user.telegramId, message, options);

      logger.debug('Notification sent', { userId, telegramId: user.telegramId });
      return true;
    } catch (error) {
      logger.error('Error sending notification', { 
        userId, 
        error: error.message 
      });
      return false;
    }
  }

  async sendNotificationByTelegramId(telegramId, message, options = {}) {
    try {
      if (!botConfig.isInitialized()) {
        logger.warn('Bot not initialized, skipping notification');
        return false;
      }

      await botConfig.sendMessage(telegramId, message, options);

      logger.debug('Notification sent', { telegramId });
      return true;
    } catch (error) {
      logger.error('Error sending notification by telegram ID', { 
        telegramId, 
        error: error.message 
      });
      return false;
    }
  }

  async sendOrderNotification(order, status) {
    try {
      logger.info('Sending order notification', { 
        orderId: order._id, 
        status 
      });

      await order.populate(['customerId', 'vendorId', 'courierId']);

      switch (status) {
        case 'created':
        case 'pending':
          await this.notifyVendorNewOrder(order);
          await this.notifyCustomerOrderCreated(order);
          break;

        case 'accepted':
          await this.notifyCustomerOrderAccepted(order);
          break;

        case 'preparing':
          await this.notifyCustomerOrderPreparing(order);
          break;

        case 'ready':
          await this.notifyCustomerOrderReady(order);
          break;

        case 'assigned':
          await this.notifyCustomerCourierAssigned(order);
          await this.notifyCourierOrderAssigned(order);
          break;

        case 'picked_up':
          await this.notifyCustomerOrderPickedUp(order);
          break;

        case 'in_transit':
          await this.notifyCustomerOrderInTransit(order);
          break;

        case 'delivered':
          await this.notifyCustomerOrderDelivered(order);
          await this.notifyVendorOrderDelivered(order);
          break;

        case 'cancelled':
          await this.notifyCustomerOrderCancelled(order);
          await this.notifyVendorOrderCancelled(order);
          if (order.courierId) {
            await this.notifyCourierOrderCancelled(order);
          }
          break;

        default:
          logger.warn('Unknown order status for notification', { status });
      }

      return true;
    } catch (error) {
      logger.error('Error sending order notification', { 
        orderId: order._id, 
        status,
        error: error.message 
      });
      return false;
    }
  }

  async notifyCustomerOrderCreated(order) {
    const message = `
🎉 <b>Buyurtmangiz qabul qilindi!</b>

📦 Buyurtma: ${order.orderNumber}
🏪 Do'kon: ${order.vendorId?.name || 'N/A'}
💰 Summa: ${order.total.toLocaleString()} UZS
📍 Manzil: ${order.deliveryLocation?.address || 'N/A'}

Do'kon tez orada buyurtmani tasdiqlaydi.
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyVendorNewOrder(order) {
    const message = `
🔔 <b>Yangi buyurtma!</b>

📦 Buyurtma: ${order.orderNumber}
👤 Mijoz: ${order.customerId?.firstName || 'N/A'} ${order.customerId?.lastName || ''}
💰 Summa: ${order.total.toLocaleString()} UZS
📱 Telefon: ${order.customerId?.phone || 'N/A'}
📍 Manzil: ${order.deliveryLocation?.address || 'N/A'}

Mahsulotlar:
${order.items.map(item => `• ${item.productName} x${item.quantity}`).join('\n')}

Buyurtmani qabul qilish yoki rad etish uchun admin panelga kiring.
    `.trim();

    return this.sendNotification(order.vendorId?.ownerId, message);
  }

  async notifyCustomerOrderAccepted(order) {
    const message = `
✅ <b>Buyurtma tasdiqlandi!</b>

📦 Buyurtma: ${order.orderNumber}
🏪 Do'kon: ${order.vendorId?.name || 'N/A'}

Do'kon buyurtmangizni tayyorlashni boshladi.
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyCustomerOrderPreparing(order) {
    const message = `
👨‍🍳 <b>Buyurtma tayyorlanmoqda</b>

📦 Buyurtma: ${order.orderNumber}
🏪 Do'kon: ${order.vendorId?.name || 'N/A'}

Buyurtmangiz tayyorlanmoqda. Tez orada tayyor bo'ladi!
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyCustomerOrderReady(order) {
    const message = `
✨ <b>Buyurtma tayyor!</b>

📦 Buyurtma: ${order.orderNumber}
🏪 Do'kon: ${order.vendorId?.name || 'N/A'}

Buyurtmangiz tayyor. Kuryer tez orada olib ketadi.
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyCustomerCourierAssigned(order) {
    const message = `
🚗 <b>Kuryer tayinlandi!</b>

📦 Buyurtma: ${order.orderNumber}
👤 Kuryer: ${order.courierId?.userId?.firstName || 'N/A'}
🚙 Transport: ${order.courierId?.vehicleType || 'N/A'}

Kuryer tez orada buyurtmani olib ketadi.
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyCourierOrderAssigned(order) {
    const message = `
📦 <b>Sizga yangi buyurtma tayinlandi!</b>

📦 Buyurtma: ${order.orderNumber}
🏪 Do'kon: ${order.vendorId?.name || 'N/A'}
📍 Do'kon manzili: ${order.vendorId?.location?.address || 'N/A'}
📱 Telefon: ${order.vendorId?.phone || 'N/A'}

📍 Yetkazib berish manzili: ${order.deliveryLocation?.address || 'N/A'}
📱 Mijoz: ${order.customerId?.phone || 'N/A'}

💰 Yetkazib berish haqqi: ${order.deliveryFee.toLocaleString()} UZS
    `.trim();

    return this.sendNotification(order.courierId?.userId, message);
  }

  async notifyCustomerOrderPickedUp(order) {
    const message = `
📦 <b>Kuryer buyurtmani oldi!</b>

📦 Buyurtma: ${order.orderNumber}
👤 Kuryer: ${order.courierId?.userId?.firstName || 'N/A'}

Buyurtmangiz yo'lda. Tez orada yetkazib beriladi.
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyCustomerOrderInTransit(order) {
    const message = `
🚗 <b>Buyurtma yo'lda!</b>

📦 Buyurtma: ${order.orderNumber}
👤 Kuryer: ${order.courierId?.userId?.firstName || 'N/A'}

Buyurtmangiz sizga yetkazilmoqda.
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyCustomerOrderDelivered(order) {
    const message = `
🎉 <b>Buyurtma yetkazib berildi!</b>

📦 Buyurtma: ${order.orderNumber}
💰 Summa: ${order.total.toLocaleString()} UZS
${order.paymentType === 'cash' ? '💵 To\'lov: Naqd' : '💳 To\'lov: Karta'}

Buyurtmangiz uchun rahmat! Iltimos, xizmat sifatini baholang.
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyVendorOrderDelivered(order) {
    const message = `
✅ <b>Buyurtma yetkazib berildi!</b>

📦 Buyurtma: ${order.orderNumber}
💰 Summa: ${order.total.toLocaleString()} UZS
    `.trim();

    return this.sendNotification(order.vendorId?.ownerId, message);
  }

  async notifyCustomerOrderCancelled(order) {
    const message = `
❌ <b>Buyurtma bekor qilindi</b>

📦 Buyurtma: ${order.orderNumber}
${order.cancellationReason ? `\n📝 Sabab: ${order.cancellationReason}` : ''}

Noqulaylik uchun uzr so'raymiz.
    `.trim();

    return this.sendNotification(order.customerId._id, message);
  }

  async notifyVendorOrderCancelled(order) {
    const message = `
❌ <b>Buyurtma bekor qilindi</b>

📦 Buyurtma: ${order.orderNumber}
${order.cancellationReason ? `\n📝 Sabab: ${order.cancellationReason}` : ''}
    `.trim();

    return this.sendNotification(order.vendorId?.ownerId, message);
  }

  async notifyCourierOrderCancelled(order) {
    const message = `
❌ <b>Buyurtma bekor qilindi</b>

📦 Buyurtma: ${order.orderNumber}
${order.cancellationReason ? `\n📝 Sabab: ${order.cancellationReason}` : ''}

Siz endi boshqa buyurtmalarni qabul qilishingiz mumkin.
    `.trim();

    return this.sendNotification(order.courierId?.userId, message);
  }

  async sendCourierAssignedNotification(order, courier) {
    try {
      await this.notifyCustomerCourierAssigned(order);
      await this.notifyCourierOrderAssigned(order);
      return true;
    } catch (error) {
      logger.error('Error sending courier assigned notification', { 
        orderId: order._id,
        courierId: courier._id,
        error: error.message 
      });
      return false;
    }
  }

  async sendPaymentNotification(order, paymentStatus) {
    try {
      const message = paymentStatus === 'paid'
        ? `
✅ <b>To'lov qabul qilindi!</b>

📦 Buyurtma: ${order.orderNumber}
💰 Summa: ${order.total.toLocaleString()} UZS
${order.paymentType === 'cash' ? '💵 To\'lov turi: Naqd' : '💳 To\'lov turi: Karta'}
        `.trim()
        : `
❌ <b>To'lov amalga oshmadi</b>

📦 Buyurtma: ${order.orderNumber}
💰 Summa: ${order.total.toLocaleString()} UZS

Iltimos, qayta urinib ko'ring.
        `.trim();

      await this.sendNotification(order.customerId, message);
      return true;
    } catch (error) {
      logger.error('Error sending payment notification', { 
        orderId: order._id,
        error: error.message 
      });
      return false;
    }
  }

  async sendBulkNotification(userIds, message, options = {}) {
    try {
      logger.info('Sending bulk notification', { count: userIds.length });

      const results = await Promise.allSettled(
        userIds.map(userId => this.sendNotification(userId, message, options))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;

      logger.info('Bulk notification completed', { 
        total: userIds.length, 
        successful, 
        failed 
      });

      return { successful, failed, total: userIds.length };
    } catch (error) {
      logger.error('Error sending bulk notification', { error: error.message });
      throw error;
    }
  }

  async sendNotificationToRole(role, message, options = {}) {
    try {
      logger.info('Sending notification to role', { role });

      const users = await User.find({ role, isActive: true });
      const userIds = users.map(u => u._id);

      return this.sendBulkNotification(userIds, message, options);
    } catch (error) {
      logger.error('Error sending notification to role', { 
        role, 
        error: error.message 
      });
      throw error;
    }
  }

  async sendLocationUpdate(chatId, latitude, longitude, options = {}) {
    try {
      if (!botConfig.isInitialized()) {
        logger.warn('Bot not initialized, skipping location update');
        return false;
      }

      await botConfig.sendLocation(chatId, latitude, longitude, options);

      logger.debug('Location update sent', { chatId });
      return true;
    } catch (error) {
      logger.error('Error sending location update', { 
        chatId, 
        error: error.message 
      });
      return false;
    }
  }
}

module.exports = new NotificationService();
