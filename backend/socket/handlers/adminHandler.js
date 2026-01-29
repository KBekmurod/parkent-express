const orderService = require('../../services/orderService');
const vendorService = require('../../services/vendorService');
const courierService = require('../../services/courierService');
const userService = require('../../services/userService');
const { createLogger } = require('../../utils/logger');
const EVENTS = require('../events');

const logger = createLogger('socket-admin');

const registerAdminHandlers = (io, socket) => {
  socket.on(EVENTS.ADMIN_STATS_REQUEST, async (data) => {
    try {
      if (socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      const { timeRange } = data || {};
      
      const filters = {};
      
      if (timeRange) {
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(now.setHours(0, 0, 0, 0));
        }
        
        filters.startDate = startDate;
        filters.endDate = new Date();
      }
      
      const [orderStats, onlineCouriers, activeOrders] = await Promise.all([
        orderService.getOrderStats(filters),
        courierService.listCouriers({ isOnline: true }, 1, 100),
        orderService.listOrders({ isActive: true }, 1, 100)
      ]);
      
      socket.emit(EVENTS.ADMIN_STATS_RESPONSE, {
        orderStats,
        onlineCouriers: onlineCouriers.data.length,
        activeOrders: activeOrders.data.length,
        timestamp: new Date()
      });
      
      logger.info(`Admin stats sent to ${socket.userId}`);
      
    } catch (error) {
      logger.error('Error fetching admin stats:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on('admin:broadcast', async (data) => {
    try {
      if (socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      const { message, targetRole } = data;
      
      if (!message) {
        socket.emit(EVENTS.ERROR, { message: 'Message is required' });
        return;
      }
      
      let room = 'all-users';
      
      if (targetRole) {
        room = `role:${targetRole}`;
      }
      
      io.to(room).emit(EVENTS.NOTIFICATION, {
        type: 'broadcast',
        message,
        from: 'admin',
        timestamp: new Date()
      });
      
      logger.info(`Admin broadcast sent to ${room}`);
      
    } catch (error) {
      logger.error('Error broadcasting message:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on('admin:order_monitor', async (data) => {
    try {
      if (socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      socket.join('admin-order-monitor');
      
      const activeOrders = await orderService.listOrders({ isActive: true }, 1, 50);
      
      socket.emit('admin:active_orders', {
        orders: activeOrders.data,
        total: activeOrders.pagination.total
      });
      
      logger.info(`Admin ${socket.userId} joined order monitoring`);
      
    } catch (error) {
      logger.error('Error setting up order monitoring:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
  
  socket.on('admin:courier_monitor', async (data) => {
    try {
      if (socket.userRole !== 'admin') {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      
      socket.join('admin-courier-monitor');
      
      const onlineCouriers = await courierService.listCouriers({ isOnline: true }, 1, 50);
      
      socket.emit('admin:online_couriers', {
        couriers: onlineCouriers.data,
        total: onlineCouriers.pagination.total
      });
      
      logger.info(`Admin ${socket.userId} joined courier monitoring`);
      
    } catch (error) {
      logger.error('Error setting up courier monitoring:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });
};

module.exports = registerAdminHandlers;
