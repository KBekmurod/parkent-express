/**
 * Notification Service - Sends notifications across bots
 */
class NotificationService {
  constructor() {
    this.customerBot = null;
    this.courierBot = null;
    this.adminBot = null;
  }

  /**
   * Initialize bots for notifications
   */
  initializeBots(customerBot, courierBot, adminBot) {
    this.customerBot = customerBot;
    this.courierBot = courierBot;
    this.adminBot = adminBot;
  }

  /**
   * Send notification to customer
   */
  async notifyCustomer(customerId, message, options = {}) {
    try {
      if (!this.customerBot) {
        console.error('Customer bot not initialized');
        return;
      }
      await this.customerBot.sendMessage(customerId, message, options);
    } catch (error) {
      console.error('Error sending customer notification:', error);
    }
  }

  /**
   * Send notification to courier
   */
  async notifyCourier(courierId, message, options = {}) {
    try {
      if (!this.courierBot) {
        console.error('Courier bot not initialized');
        return;
      }
      await this.courierBot.sendMessage(courierId, message, options);
    } catch (error) {
      console.error('Error sending courier notification:', error);
    }
  }

  /**
   * Send notification to admin
   */
  async notifyAdmin(adminId, message, options = {}) {
    try {
      if (!this.adminBot) {
        console.error('Admin bot not initialized');
        return;
      }
      await this.adminBot.sendMessage(adminId, message, options);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  /**
   * Notify admin about new order
   */
  async notifyAdminNewOrder(order) {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (!adminId) return;

    const message = `🆕 Yangi buyurtma!\n\n` +
      `📍 Manzil: ${order.location.address || 'Lokatsiya yuborilgan'}\n` +
      `📝 Buyurtma: ${order.orderDetails}\n` +
      `💰 To'lov: ${order.paymentType === 'cash' ? 'Naqd' : 'Kurer kartasiga'}\n` +
      `📞 Telefon: ${order.customerPhone}\n` +
      `🆔 Buyurtma ID: ${order._id}`;

    await this.notifyAdmin(adminId, message);
  }

  /**
   * Notify admin about delivery completion
   */
  async notifyAdminDeliveryComplete(order, courier) {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (!adminId) return;

    const message = `✅ Buyurtma yetkazildi!\n\n` +
      `🆔 Buyurtma ID: ${order._id}\n` +
      `🚴 Kurer: ${courier ? courier.telegramId : 'Noma\'lum'}\n` +
      `💰 To'lov: ${order.paymentType === 'cash' ? 'Naqd' : 'Kurer kartasiga'}\n` +
      `⏱ Vaqt: ${new Date().toLocaleString('uz-UZ')}`;

    await this.notifyAdmin(adminId, message);
  }

  /**
   * Send location to courier
   */
  async sendLocationToCourier(courierId, latitude, longitude) {
    try {
      if (!this.courierBot) {
        console.error('Courier bot not initialized');
        return;
      }
      await this.courierBot.sendLocation(courierId, latitude, longitude);
    } catch (error) {
      console.error('Error sending location to courier:', error);
    }
  }
}

module.exports = new NotificationService();
