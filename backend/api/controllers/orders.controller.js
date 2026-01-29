const { orderService } = require('../../services');
const { PAGINATION } = require('../../config/constants');
const logger = require('../../utils/logger');

class OrdersController {
  async getAllOrders(req, res, next) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        status,
        vendorId,
        courierId,
        customerId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);

      const options = {
        page: pageNum,
        limit: limitNum,
        sortBy,
        sortOrder,
        status,
        vendorId,
        courierId,
        customerId
      };

      const result = await orderService.getAllOrders(options);

      logger.info('Retrieved all orders', { 
        page: pageNum, 
        limit: limitNum, 
        total: result.pagination.total 
      });

      return res.status(200).json({
        success: true,
        data: {
          orders: result.orders,
          pagination: result.pagination
        },
        message: 'Orders retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting all orders', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;

      const order = await orderService.getOrderById(id);

      logger.info('Retrieved order by ID', { orderId: id });

      return res.status(200).json({
        success: true,
        data: { order },
        message: 'Order retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting order by ID', { orderId: req.params.id, error: error.message });
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const orderData = req.body;

      const order = await orderService.createOrder(orderData);

      logger.info('Created new order', { orderId: order._id });

      return res.status(201).json({
        success: true,
        data: { order },
        message: 'Order created successfully'
      });
    } catch (error) {
      logger.error('Error creating order', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const updatedBy = req.user.userId;

      const order = await orderService.updateOrderStatus(id, status, updatedBy, note);

      logger.info('Updated order status', { orderId: id, newStatus: status });

      return res.status(200).json({
        success: true,
        data: { order },
        message: 'Order status updated successfully'
      });
    } catch (error) {
      logger.error('Error updating order status', { 
        orderId: req.params.id, 
        error: error.message 
      });
      next(error);
    }
  }

  async assignCourier(req, res, next) {
    try {
      const { id } = req.params;
      const updatedBy = req.user.userId;

      const order = await orderService.assignCourier(id, updatedBy);

      logger.info('Assigned courier to order', { orderId: id, courierId: order.courierId });

      return res.status(200).json({
        success: true,
        data: { order },
        message: 'Courier assigned successfully'
      });
    } catch (error) {
      logger.error('Error assigning courier', { orderId: req.params.id, error: error.message });
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cancelledBy = req.user.userId;

      const order = await orderService.cancelOrder(id, cancelledBy, reason);

      logger.info('Cancelled order', { orderId: id, reason });

      return res.status(200).json({
        success: true,
        data: { order },
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      logger.error('Error cancelling order', { orderId: req.params.id, error: error.message });
      next(error);
    }
  }

  async rateOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { rating, feedback } = req.body;

      const order = await orderService.addOrderRating(id, rating, feedback);

      logger.info('Added order rating', { orderId: id, rating });

      return res.status(200).json({
        success: true,
        data: { order },
        message: 'Order rated successfully'
      });
    } catch (error) {
      logger.error('Error rating order', { orderId: req.params.id, error: error.message });
      next(error);
    }
  }
}

module.exports = new OrdersController();
