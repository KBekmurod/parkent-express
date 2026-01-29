const orderService = require('../../services/orderService');
const { createLogger } = require('../../utils/logger');
const EVENTS = require('../events');

const logger = createLogger('socket-order');

const registerOrderHandlers = (io, socket) => {
  socket.on(EVENTS.ORDER_ACCEPT, async (data) => {
    try {
      const { orderId } = data;
      
      if (!orderId) {
        socket.emit(EVENTS.ERROR, { message: 'Order ID is required' });
        return;
      }
      
      if (socket.userRole !== 'vendor' && socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      const order = await orderService.confirmOrder(orderId, socket.userId);
      
      socket.emit(EVENTS.ORDER_UPDATED, { order });
      
      io.to(`order:${orderId}`).emit(EVENTS.ORDER_STATUS_CHANGED, {
        orderId: order._id,
        status: order.status,
        timestamp: new Date()
      });
      
      io.to(`user:${order.customer._id}`).emit(EVENTS.ORDER_UPDATED, { order });
      
      logger.info(`Order ${orderId} accepted by vendor ${socket.userId}`);
      
    } catch (error) {
      logger.error('Error accepting order:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on(EVENTS.ORDER_REJECT, async (data) => {
    try {
      const { orderId, reason } = data;
      
      if (!orderId) {
        socket.emit(EVENTS.ERROR, { message: 'Order ID is required' });
        return;
      }
      
      if (socket.userRole !== 'vendor' && socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      const order = await orderService.rejectOrder(orderId, socket.userId, reason);
      
      socket.emit(EVENTS.ORDER_UPDATED, { order });
      
      io.to(`order:${orderId}`).emit(EVENTS.ORDER_STATUS_CHANGED, {
        orderId: order._id,
        status: order.status,
        timestamp: new Date()
      });
      
      io.to(`user:${order.customer._id}`).emit(EVENTS.ORDER_UPDATED, { order });
      
      logger.info(`Order ${orderId} rejected by vendor ${socket.userId}`);
      
    } catch (error) {
      logger.error('Error rejecting order:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on(EVENTS.ORDER_CANCEL, async (data) => {
    try {
      const { orderId, reason } = data;
      
      if (!orderId) {
        socket.emit(EVENTS.ERROR, { message: 'Order ID is required' });
        return;
      }
      
      const order = await orderService.cancelOrder(orderId, socket.userId, reason);
      
      socket.emit(EVENTS.ORDER_UPDATED, { order });
      
      io.to(`order:${orderId}`).emit(EVENTS.ORDER_STATUS_CHANGED, {
        orderId: order._id,
        status: order.status,
        timestamp: new Date()
      });
      
      logger.info(`Order ${orderId} cancelled by user ${socket.userId}`);
      
    } catch (error) {
      logger.error('Error cancelling order:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on(EVENTS.JOIN_ROOM, (data) => {
    try {
      const { room } = data;
      
      if (!room) {
        socket.emit(EVENTS.ERROR, { message: 'Room name is required' });
        return;
      }
      
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
      
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on(EVENTS.LEAVE_ROOM, (data) => {
    try {
      const { room } = data;
      
      if (!room) {
        socket.emit(EVENTS.ERROR, { message: 'Room name is required' });
        return;
      }
      
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room: ${room}`);
      
    } catch (error) {
      logger.error('Error leaving room:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
};

module.exports = registerOrderHandlers;
