const { statsService } = require('../../services');
const logger = require('../../utils/logger');

class StatsController {
  async getDashboardStats(req, res, next) {
    try {
      const { period = 'today' } = req.query;

      const stats = await statsService.getDashboardStats(period);

      logger.info('Retrieved dashboard stats', { period });

      return res.status(200).json({
        success: true,
        data: { stats },
        message: 'Dashboard stats retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting dashboard stats', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async getVendorStats(req, res, next) {
    try {
      const { id } = req.params;
      const { period = 'all' } = req.query;

      const stats = await statsService.getVendorStats(id, period);

      logger.info('Retrieved vendor stats', { vendorId: id, period });

      return res.status(200).json({
        success: true,
        data: { stats },
        message: 'Vendor stats retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting vendor stats', { 
        vendorId: req.params.id, 
        error: error.message 
      });
      next(error);
    }
  }

  async getCourierStats(req, res, next) {
    try {
      const { id } = req.params;
      const { period = 'all' } = req.query;

      const stats = await statsService.getCourierStats(id, period);

      logger.info('Retrieved courier stats', { courierId: id, period });

      return res.status(200).json({
        success: true,
        data: { stats },
        message: 'Courier stats retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting courier stats', { 
        courierId: req.params.id, 
        error: error.message 
      });
      next(error);
    }
  }

  async getRevenueStats(req, res, next) {
    try {
      const { period = 'month' } = req.query;

      const stats = await statsService.getRevenueStats(period);

      logger.info('Retrieved revenue stats', { period });

      return res.status(200).json({
        success: true,
        data: { stats },
        message: 'Revenue stats retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting revenue stats', { error: error.message, stack: error.stack });
      next(error);
    }
  }
}

module.exports = new StatsController();
