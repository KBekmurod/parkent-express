const { productService } = require('../../services');
const { PAGINATION } = require('../../config/constants');
const logger = require('../../utils/logger');

class ProductsController {
  async getAllProducts(req, res, next) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        vendorId,
        category,
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
        sortOrder,
        category
      };

      let result;

      if (vendorId) {
        result = await productService.getProductsByVendor(vendorId, options);
      } else if (category) {
        result = await productService.getProductsByCategory(category, options);
      } else if (search) {
        result = await productService.searchProducts(search, options);
      } else {
        const Product = require('../../models/Product');
        const skip = (pageNum - 1) * limitNum;

        const products = await Product.find()
          .populate('vendorId')
          .skip(skip)
          .limit(limitNum)
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

        const total = await Product.countDocuments();

        result = {
          products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        };
      }

      logger.info('Retrieved all products', { 
        page: pageNum, 
        limit: limitNum, 
        total: result.pagination.total 
      });

      return res.status(200).json({
        success: true,
        data: {
          products: result.products,
          pagination: result.pagination
        },
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting all products', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      const product = await productService.getProductById(id);

      logger.info('Retrieved product by ID', { productId: id });

      return res.status(200).json({
        success: true,
        data: { product },
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting product by ID', { productId: req.params.id, error: error.message });
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const productData = req.body;

      const product = await productService.createProduct(productData);

      logger.info('Created new product', { productId: product._id });

      return res.status(201).json({
        success: true,
        data: { product },
        message: 'Product created successfully'
      });
    } catch (error) {
      logger.error('Error creating product', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await productService.updateProduct(id, updateData);

      logger.info('Updated product', { productId: id });

      return res.status(200).json({
        success: true,
        data: { product },
        message: 'Product updated successfully'
      });
    } catch (error) {
      logger.error('Error updating product', { productId: req.params.id, error: error.message });
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      await productService.deleteProduct(id);

      logger.info('Deleted product', { productId: id });

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting product', { productId: req.params.id, error: error.message });
      next(error);
    }
  }
}

module.exports = new ProductsController();
