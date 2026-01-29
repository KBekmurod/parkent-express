const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const logger = require('../utils/logger');
const { 
  NotFoundError, 
  ValidationError, 
  BadRequestError 
} = require('../utils/errorTypes');

class ProductService {
  async createProduct(productData) {
    try {
      logger.info('Creating new product', { name: productData.name, vendorId: productData.vendorId });

      const vendor = await Vendor.findById(productData.vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      const product = new Product(productData);
      await product.save();

      logger.info('Product created successfully', { productId: product._id });
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error creating product', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getProductById(productId) {
    try {
      const product = await Product.findById(productId).populate('vendorId');

      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting product by ID', { productId, error: error.message });
      throw error;
    }
  }

  async updateProduct(productId, updateData) {
    try {
      logger.info('Updating product', { productId });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      const allowedFields = [
        'name', 'nameUz', 'description', 'descriptionUz', 
        'price', 'category', 'imageUrl', 'isAvailable', 
        'preparationTime', 'weight', 'calories', 'ingredients', 
        'allergens', 'spicyLevel', 'isVegetarian', 'isVegan'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          product[field] = updateData[field];
        }
      });

      await product.save();

      logger.info('Product updated successfully', { productId });
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating product', { productId, error: error.message });
      throw error;
    }
  }

  async toggleProductAvailability(productId) {
    try {
      logger.info('Toggling product availability', { productId });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      await product.toggleAvailability();

      logger.info('Product availability toggled', { productId, isAvailable: product.isAvailable });
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error toggling product availability', { productId, error: error.message });
      throw error;
    }
  }

  async checkProductAvailability(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      const isAvailable = await product.checkAvailability();

      logger.debug('Checked product availability', { productId, isAvailable });
      return {
        productId: product._id,
        name: product.name,
        isAvailable,
        productAvailable: product.isAvailable
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error checking product availability', { productId, error: error.message });
      throw error;
    }
  }

  async getProductsByVendor(vendorId, options = {}) {
    try {
      const { availableOnly = true, page = 1, limit = 50 } = options;
      const skip = (page - 1) * limit;

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found', 'Vendor');
      }

      const query = { vendorId };
      if (availableOnly) {
        query.isAvailable = true;
      }

      const products = await Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ category: 1, name: 1 });

      const total = await Product.countDocuments(query);

      logger.info('Retrieved products by vendor', { vendorId, count: products.length });

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error getting products by vendor', { vendorId, error: error.message });
      throw error;
    }
  }

  async getProductsByCategory(category, options = {}) {
    try {
      const { availableOnly = true, page = 1, limit = 50 } = options;
      const skip = (page - 1) * limit;

      const query = { category };
      if (availableOnly) {
        query.isAvailable = true;
      }

      const products = await Product.find(query)
        .populate('vendorId', 'name nameUz isActive isPaused')
        .skip(skip)
        .limit(limit)
        .sort({ soldCount: -1 });

      const total = await Product.countDocuments(query);

      logger.info('Retrieved products by category', { category, count: products.length });

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting products by category', { category, error: error.message });
      throw error;
    }
  }

  async searchProducts(searchQuery, options = {}) {
    try {
      const { page = 1, limit = 50, vendorId } = options;
      const skip = (page - 1) * limit;

      const query = {
        isAvailable: true,
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { nameUz: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } }
        ]
      };

      if (vendorId) {
        query.vendorId = vendorId;
      }

      const products = await Product.find(query)
        .populate('vendorId', 'name nameUz isActive')
        .skip(skip)
        .limit(limit)
        .sort({ soldCount: -1 });

      const total = await Product.countDocuments(query);

      logger.info('Searched products', { query: searchQuery, count: products.length });

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching products', { searchQuery, error: error.message });
      throw error;
    }
  }

  async getPopularProducts(limit = 10) {
    try {
      const products = await Product.findPopular(limit);

      logger.info('Retrieved popular products', { count: products.length });
      return products;
    } catch (error) {
      logger.error('Error getting popular products', { error: error.message });
      throw error;
    }
  }

  async getDiscountedProducts(options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const skip = (page - 1) * limit;

      const products = await Product.findDiscounted()
        .populate('vendorId', 'name nameUz')
        .skip(skip)
        .limit(limit)
        .sort({ 'discount.percentage': -1 });

      const total = products.length;

      logger.info('Retrieved discounted products', { count: products.length });

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting discounted products', { error: error.message });
      throw error;
    }
  }

  async setProductDiscount(productId, percentage, validUntil = null) {
    try {
      logger.info('Setting product discount', { productId, percentage });

      if (percentage < 0 || percentage > 100) {
        throw new ValidationError('Discount percentage must be between 0 and 100');
      }

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      await product.setDiscount(percentage, validUntil);

      logger.info('Product discount set successfully', { productId, percentage });
      return product;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Error setting product discount', { productId, error: error.message });
      throw error;
    }
  }

  async removeProductDiscount(productId) {
    try {
      logger.info('Removing product discount', { productId });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      await product.removeDiscount();

      logger.info('Product discount removed successfully', { productId });
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error removing product discount', { productId, error: error.message });
      throw error;
    }
  }

  async incrementProductViews(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      await product.incrementViews();

      logger.debug('Product view count incremented', { productId, viewCount: product.viewCount });
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error incrementing product views', { productId, error: error.message });
      throw error;
    }
  }

  async incrementProductSales(productId, quantity = 1) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      await product.incrementSales(quantity);

      logger.debug('Product sales incremented', { productId, soldCount: product.soldCount });
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error incrementing product sales', { productId, error: error.message });
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      logger.info('Deleting product', { productId });

      const product = await Product.findByIdAndDelete(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'Product');
      }

      logger.info('Product deleted successfully', { productId });
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deleting product', { productId, error: error.message });
      throw error;
    }
  }

  async bulkUpdateAvailability(vendorId, productIds, isAvailable) {
    try {
      logger.info('Bulk updating product availability', { vendorId, count: productIds.length });

      const result = await Product.updateMany(
        { 
          _id: { $in: productIds },
          vendorId 
        },
        { isAvailable }
      );

      logger.info('Products availability updated', { 
        modified: result.modifiedCount 
      });

      return result;
    } catch (error) {
      logger.error('Error bulk updating availability', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ProductService();
