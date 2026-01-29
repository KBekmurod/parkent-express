const Order = require('../models/Order');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const { 
  NotFoundError, 
  ValidationError, 
  BadRequestError 
} = require('../utils/errorTypes');

class PaymentService {
  async markAsPaid(orderId, paymentDetails = {}) {
    try {
      logger.info('Marking order as paid', { orderId });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      if (order.paymentStatus === 'paid') {
        logger.warn('Order already marked as paid', { orderId });
        return order;
      }

      order.paymentStatus = 'paid';
      
      if (paymentDetails.transactionId) {
        order.transactionId = paymentDetails.transactionId;
      }
      
      if (paymentDetails.paymentMethod) {
        order.paymentType = paymentDetails.paymentMethod;
      }

      await order.save();

      logger.info('Order marked as paid', { 
        orderId, 
        amount: order.total 
      });

      setImmediate(() => {
        notificationService.sendPaymentNotification(order, 'paid').catch(err => {
          logger.error('Failed to send payment notification', { error: err.message });
        });
      });

      return order;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error marking order as paid', { orderId, error: error.message });
      throw error;
    }
  }

  async markAsFailed(orderId, failureReason = null) {
    try {
      logger.info('Marking payment as failed', { orderId });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      order.paymentStatus = 'failed';
      order.paymentFailureReason = failureReason;

      await order.save();

      logger.info('Payment marked as failed', { orderId, reason: failureReason });

      setImmediate(() => {
        notificationService.sendPaymentNotification(order, 'failed').catch(err => {
          logger.error('Failed to send payment failure notification', { error: err.message });
        });
      });

      return order;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error marking payment as failed', { orderId, error: error.message });
      throw error;
    }
  }

  async processRefund(orderId, refundAmount = null, reason = null) {
    try {
      logger.info('Processing refund', { orderId });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      if (order.paymentStatus !== 'paid') {
        throw new BadRequestError('Cannot refund order that is not paid');
      }

      if (order.status !== 'cancelled') {
        throw new BadRequestError('Can only refund cancelled orders');
      }

      const amountToRefund = refundAmount || order.total;

      if (amountToRefund > order.total) {
        throw new ValidationError('Refund amount cannot exceed order total');
      }

      order.paymentStatus = 'refunded';
      order.refundAmount = amountToRefund;
      order.refundReason = reason;
      order.refundedAt = new Date();

      await order.save();

      logger.info('Refund processed', { 
        orderId, 
        amount: amountToRefund 
      });

      return order;
    } catch (error) {
      if (error instanceof NotFoundError || 
          error instanceof BadRequestError || 
          error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error processing refund', { orderId, error: error.message });
      throw error;
    }
  }

  async getPaymentStatus(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      const paymentInfo = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        paymentType: order.paymentType,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        transactionId: order.transactionId,
        paidAt: order.paidAt,
        refundAmount: order.refundAmount,
        refundedAt: order.refundedAt
      };

      logger.debug('Retrieved payment status', { orderId });
      return paymentInfo;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting payment status', { orderId, error: error.message });
      throw error;
    }
  }

  async processCardPayment(orderId, cardDetails) {
    try {
      logger.info('Processing card payment', { orderId });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      if (order.paymentStatus === 'paid') {
        logger.warn('Order already paid', { orderId });
        return order;
      }

      logger.info('Card payment simulation - auto approving', { orderId });
      
      const paymentDetails = {
        paymentMethod: 'card',
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };

      await this.markAsPaid(orderId, paymentDetails);

      logger.info('Card payment processed successfully', { orderId });
      return order;
    } catch (error) {
      logger.error('Error processing card payment', { orderId, error: error.message });
      await this.markAsFailed(orderId, error.message);
      throw error;
    }
  }

  async processCashPayment(orderId) {
    try {
      logger.info('Processing cash payment', { orderId });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      if (order.status !== 'delivered') {
        throw new BadRequestError('Cash payment can only be confirmed after delivery');
      }

      const paymentDetails = {
        paymentMethod: 'cash',
        transactionId: `CASH-${Date.now()}`
      };

      await this.markAsPaid(orderId, paymentDetails);

      logger.info('Cash payment processed successfully', { orderId });
      return order;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
      logger.error('Error processing cash payment', { orderId, error: error.message });
      throw error;
    }
  }

  async getPaymentHistory(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        paymentType,
        startDate,
        endDate 
      } = options;
      const skip = (page - 1) * limit;

      const query = {};
      
      if (status) {
        query.paymentStatus = status;
      }
      
      if (paymentType) {
        query.paymentType = paymentType;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const payments = await Order.find(query)
        .select('orderNumber customerId vendorId paymentStatus paymentType subtotal deliveryFee total createdAt paidAt')
        .populate('customerId', 'firstName lastName username')
        .populate('vendorId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(query);

      logger.info('Retrieved payment history', { count: payments.length });

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting payment history', { error: error.message });
      throw error;
    }
  }

  async getPaymentSummary(options = {}) {
    try {
      const { startDate, endDate } = options;

      const query = {};
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const summary = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$total' }
          }
        }
      ]);

      const paymentTypeSummary = await Order.aggregate([
        { $match: { ...query, paymentStatus: 'paid' } },
        {
          $group: {
            _id: '$paymentType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$total' }
          }
        }
      ]);

      const totalOrders = summary.reduce((sum, item) => sum + item.count, 0);
      const totalRevenue = summary
        .filter(item => item._id === 'paid')
        .reduce((sum, item) => sum + item.totalAmount, 0);

      logger.info('Retrieved payment summary');

      return {
        summary,
        paymentTypeSummary,
        totalOrders,
        totalRevenue
      };
    } catch (error) {
      logger.error('Error getting payment summary', { error: error.message });
      throw error;
    }
  }

  async getPendingPayments(options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const query = { paymentStatus: 'pending' };

      const payments = await Order.find(query)
        .populate('customerId', 'firstName lastName username phone')
        .populate('vendorId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(query);

      logger.info('Retrieved pending payments', { count: payments.length });

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting pending payments', { error: error.message });
      throw error;
    }
  }

  async verifyPayment(orderId) {
    try {
      logger.info('Verifying payment', { orderId });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found', 'Order');
      }

      const isVerified = order.paymentStatus === 'paid';

      logger.info('Payment verification result', { orderId, isVerified });

      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        isVerified,
        paymentStatus: order.paymentStatus,
        paymentType: order.paymentType,
        total: order.total
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error verifying payment', { orderId, error: error.message });
      throw error;
    }
  }
}

module.exports = new PaymentService();
