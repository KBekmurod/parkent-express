const { vendorService } = require('../../services');
const { PAGINATION } = require('../../config/constants');
const logger = require('../../utils/logger');

class VendorsController {
  async getAllVendors(req, res, next) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        isActive,
        search,
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

      if (isActive !== undefined) {
        options.isActive = isActive === 'true';
      }

      let result;
      if (search) {
        result = await vendorService.searchVendors(search, options);
      } else {
        result = await vendorService.getAllVendors(options);
      }

      logger.info('Retrieved all vendors', { 
        page: pageNum, 
        limit: limitNum, 
        total: result.pagination.total 
      });

      return res.status(200).json({
        success: true,
        data: {
          vendors: result.vendors,
          pagination: result.pagination
        },
        message: 'Vendors retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting all vendors', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async getVendorById(req, res, next) {
    try {
      const { id } = req.params;

      const vendor = await vendorService.getVendorById(id);

      logger.info('Retrieved vendor by ID', { vendorId: id });

      return res.status(200).json({
        success: true,
        data: { vendor },
        message: 'Vendor retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting vendor by ID', { vendorId: req.params.id, error: error.message });
      next(error);
    }
  }

  async createVendor(req, res, next) {
    try {
      const vendorData = req.body;

      const vendor = await vendorService.createVendor(vendorData);

      logger.info('Created new vendor', { vendorId: vendor._id });

      return res.status(201).json({
        success: true,
        data: { vendor },
        message: 'Vendor created successfully'
      });
    } catch (error) {
      logger.error('Error creating vendor', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async updateVendor(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vendor = await vendorService.updateVendor(id, updateData);

      logger.info('Updated vendor', { vendorId: id });

      return res.status(200).json({
        success: true,
        data: { vendor },
        message: 'Vendor updated successfully'
      });
    } catch (error) {
      logger.error('Error updating vendor', { vendorId: req.params.id, error: error.message });
      next(error);
    }
  }

  async toggleVendorStatus(req, res, next) {
    try {
      const { id } = req.params;

      const vendor = await vendorService.toggleVendorPause(id);

      logger.info('Toggled vendor status', { vendorId: id, isPaused: vendor.isPaused });

      return res.status(200).json({
        success: true,
        data: { vendor },
        message: `Vendor ${vendor.isPaused ? 'paused' : 'resumed'} successfully`
      });
    } catch (error) {
      logger.error('Error toggling vendor status', { vendorId: req.params.id, error: error.message });
      next(error);
    }
  }
}

module.exports = new VendorsController();
