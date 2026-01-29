const { courierService } = require('../../services');
const { PAGINATION } = require('../../config/constants');
const logger = require('../../utils/logger');

class CouriersController {
  async getAllCouriers(req, res, next) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        isAvailable,
        isOnline,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);

      const options = {
        page: pageNum,
        limit: limitNum,
        sortBy,
        sortOrder
      };

      if (isAvailable !== undefined) {
        options.isAvailable = isAvailable === 'true';
      }

      if (isOnline !== undefined) {
        options.isOnline = isOnline === 'true';
      }

      const result = await courierService.getAvailableCouriers(options);

      logger.info('Retrieved all couriers', { 
        page: pageNum, 
        limit: limitNum
      });

      return res.status(200).json({
        success: true,
        data: {
          couriers: result.couriers || result,
          pagination: result.pagination || {
            page: pageNum,
            limit: limitNum,
            total: result.length || 0,
            pages: Math.ceil((result.length || 0) / limitNum)
          }
        },
        message: 'Couriers retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting all couriers', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async getCourierById(req, res, next) {
    try {
      const { id } = req.params;

      const courier = await courierService.getCourierById(id);

      logger.info('Retrieved courier by ID', { courierId: id });

      return res.status(200).json({
        success: true,
        data: { courier },
        message: 'Courier retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting courier by ID', { courierId: req.params.id, error: error.message });
      next(error);
    }
  }

  async createCourier(req, res, next) {
    try {
      const courierData = req.body;

      const courier = await courierService.createCourier(courierData);

      logger.info('Created new courier', { courierId: courier._id });

      return res.status(201).json({
        success: true,
        data: { courier },
        message: 'Courier created successfully'
      });
    } catch (error) {
      logger.error('Error creating courier', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async updateCourier(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const courier = await courierService.updateCourier(id, updateData);

      logger.info('Updated courier', { courierId: id });

      return res.status(200).json({
        success: true,
        data: { courier },
        message: 'Courier updated successfully'
      });
    } catch (error) {
      logger.error('Error updating courier', { courierId: req.params.id, error: error.message });
      next(error);
    }
  }

  async updateCourierLocation(req, res, next) {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;

      const courier = await courierService.updateCourierLocation(id, latitude, longitude);

      logger.info('Updated courier location', { courierId: id, latitude, longitude });

      return res.status(200).json({
        success: true,
        data: { courier },
        message: 'Courier location updated successfully'
      });
    } catch (error) {
      logger.error('Error updating courier location', { 
        courierId: req.params.id, 
        error: error.message 
      });
      next(error);
    }
  }

  async updateCourierAvailability(req, res, next) {
    try {
      const { id } = req.params;

      const courier = await courierService.toggleCourierAvailability(id);

      logger.info('Updated courier availability', { 
        courierId: id, 
        isAvailable: courier.isAvailable 
      });

      return res.status(200).json({
        success: true,
        data: { courier },
        message: `Courier ${courier.isAvailable ? 'is now available' : 'is now unavailable'}`
      });
    } catch (error) {
      logger.error('Error updating courier availability', { 
        courierId: req.params.id, 
        error: error.message 
      });
      next(error);
    }
  }
}

module.exports = new CouriersController();
