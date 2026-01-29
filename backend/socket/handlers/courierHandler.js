const courierService = require('../../services/courierService');
const orderService = require('../../services/orderService');
const notificationService = require('../../services/notificationService');
const { createLogger } = require('../../utils/logger');
const EVENTS = require('../events');

const logger = createLogger('socket-courier');

const registerCourierHandlers = (io, socket) => {
  socket.on(EVENTS.COURIER_ONLINE, async () => {
    try {
      if (socket.userRole !== 'courier' && socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      const courier = await courierService.goOnline(socket.userId);
      
      socket.join('online-couriers');
      socket.join(`courier:${socket.userId}`);
      
      io.to('admin').emit(EVENTS.COURIER_STATUS_CHANGED, {
        courierId: courier._id,
        userId: socket.userId,
        isOnline: true,
        timestamp: new Date()
      });
      
      socket.emit(EVENTS.COURIER_STATUS_CHANGED, {
        isOnline: true,
        isAvailable: courier.isAvailable
      });
      
      logger.info(`Courier ${socket.userId} went online`);
      
    } catch (error) {
      logger.error('Error going online:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on(EVENTS.COURIER_OFFLINE, async () => {
    try {
      if (socket.userRole !== 'courier' && socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      const courier = await courierService.goOffline(socket.userId);
      
      socket.leave('online-couriers');
      
      io.to('admin').emit(EVENTS.COURIER_STATUS_CHANGED, {
        courierId: courier._id,
        userId: socket.userId,
        isOnline: false,
        timestamp: new Date()
      });
      
      socket.emit(EVENTS.COURIER_STATUS_CHANGED, {
        isOnline: false,
        isAvailable: false
      });
      
      logger.info(`Courier ${socket.userId} went offline`);
      
    } catch (error) {
      logger.error('Error going offline:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on(EVENTS.COURIER_LOCATION_UPDATE, async (data) => {
    try {
      const { latitude, longitude, accuracy, heading, speed } = data;
      
      if (!latitude || !longitude) {
        socket.emit(EVENTS.ERROR, { message: 'Location coordinates required' });
        return;
      }
      
      if (socket.userRole !== 'courier' && socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      const courier = await courierService.updateLocation(
        socket.userId,
        longitude,
        latitude,
        accuracy,
        heading,
        speed
      );
      
      if (courier.activeOrder) {
        await notificationService.notifyCourierLocationUpdate(
          courier._id,
          courier.activeOrder,
          {
            latitude,
            longitude,
            accuracy,
            heading,
            speed
          }
        );
        
        io.to(`order:${courier.activeOrder}`).emit(EVENTS.COURIER_LOCATION_UPDATED, {
          courierId: courier._id,
          location: {
            latitude,
            longitude,
            accuracy,
            heading,
            speed
          },
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      logger.error('Error updating courier location:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on(EVENTS.COURIER_ACCEPT_ORDER, async (data) => {
    try {
      const { orderId } = data;
      
      if (!orderId) {
        socket.emit(EVENTS.ERROR, { message: 'Order ID is required' });
        return;
      }
      
      if (socket.userRole !== 'courier' && socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      const order = await orderService.assignCourier(orderId, socket.userId);
      
      socket.join(`order:${orderId}`);
      
      socket.emit(EVENTS.ORDER_UPDATED, { order });
      
      io.to(`order:${orderId}`).emit(EVENTS.ORDER_STATUS_CHANGED, {
        orderId: order._id,
        status: order.status,
        courierId: socket.userId,
        timestamp: new Date()
      });
      
      io.to(`user:${order.customer._id}`).emit(EVENTS.ORDER_UPDATED, { order });
      
      logger.info(`Courier ${socket.userId} accepted order ${orderId}`);
      
    } catch (error) {
      logger.error('Error accepting order:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on(EVENTS.COURIER_ARRIVED, async (data) => {
    try {
      const { orderId, locationType } = data;
      
      if (!orderId) {
        socket.emit(EVENTS.ERROR, { message: 'Order ID is required' });
        return;
      }
      
      const message = locationType === 'vendor' 
        ? '🛵 Courier has arrived at the restaurant'
        : '🚪 Courier has arrived at your location';
      
      io.to(`order:${orderId}`).emit(EVENTS.NOTIFICATION, {
        type: 'courier_arrived',
        message,
        orderId,
        timestamp: new Date()
      });
      
      logger.info(`Courier ${socket.userId} arrived at ${locationType} for order ${orderId}`);
      
    } catch (error) {
      logger.error('Error notifying arrival:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
};

module.exports = registerCourierHandlers;
