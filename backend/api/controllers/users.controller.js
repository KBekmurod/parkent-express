const { userService } = require('../../services');
const { PAGINATION } = require('../../config/constants');
const logger = require('../../utils/logger');

class UsersController {
  async getAllUsers(req, res, next) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        role,
        isActive,
        search
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);

      let result;

      if (search) {
        result = await userService.searchUsers(search, {
          page: pageNum,
          limit: limitNum,
          role
        });
      } else {
        const query = {};
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const skip = (pageNum - 1) * limitNum;
        const users = await userService.getUsersByRole(role || 'customer', {
          page: pageNum,
          limit: limitNum,
          isActive: isActive !== undefined ? isActive === 'true' : undefined
        });

        result = users;
      }

      logger.info('Retrieved all users', { 
        page: pageNum, 
        limit: limitNum, 
        total: result.pagination.total 
      });

      return res.status(200).json({
        success: true,
        data: {
          users: result.users,
          pagination: result.pagination
        },
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting all users', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      logger.info('Retrieved user by ID', { userId: id });

      return res.status(200).json({
        success: true,
        data: { user },
        message: 'User retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting user by ID', { userId: req.params.id, error: error.message });
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const userData = req.body;

      const user = await userService.createUser(userData);

      logger.info('Created new user', { userId: user._id });

      return res.status(201).json({
        success: true,
        data: { user },
        message: 'User created successfully'
      });
    } catch (error) {
      logger.error('Error creating user', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await userService.updateUser(id, updateData);

      logger.info('Updated user', { userId: id });

      return res.status(200).json({
        success: true,
        data: { user },
        message: 'User updated successfully'
      });
    } catch (error) {
      logger.error('Error updating user', { userId: req.params.id, error: error.message });
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      await userService.deleteUser(id);

      logger.info('Deleted user', { userId: id });

      return res.status(200).json({
        success: true,
        data: null,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user', { userId: req.params.id, error: error.message });
      next(error);
    }
  }
}

module.exports = new UsersController();
