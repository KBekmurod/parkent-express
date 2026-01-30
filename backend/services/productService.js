const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { paginate, buildPaginationResponse } = require('../utils/helpers');

class ProductService {
  async createProduct(vendorId, productData) {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    const product = new Product({
      ...productData,
      vendor: vendorId
    });
    
    await product.save();
    
    return product;
  }
  
  async getProductById(productId) {
    const product = await Product.findById(productId)
      .populate('vendor');
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    product.stats.views += 1;
    await product.save();
    
    return product;
  }
  
  async updateProduct(productId, vendorId, updates) {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product.vendor.toString() !== vendorId) {
      throw new Error('Unauthorized');
    }
    
    const allowedUpdates = [
      'name',
      'description',
      'category',
      'subcategory',
      'price',
      'originalPrice',
      'images',
      'isAvailable',
      'stock',
      'specifications',
      'options',
      'tags',
      'isFeatured',
      'isNew',
      'metadata'
    ];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        product[key] = updates[key];
      }
    });
    
    await product.save();
    
    return product;
  }
  
  async toggleProductAvailability(productId, vendorId, isAvailable) {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product.vendor.toString() !== vendorId) {
      throw new Error('Unauthorized');
    }
    
    product.isAvailable = isAvailable;
    await product.save();
    
    return product;
  }
  
  async updateStock(productId, vendorId, quantity, operation = 'set') {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product.vendor.toString() !== vendorId) {
      throw new Error('Unauthorized');
    }
    
    if (!product.stock.trackStock) {
      throw new Error('Stock tracking is not enabled for this product');
    }
    
    if (operation === 'set') {
      product.stock.quantity = quantity;
    } else if (operation === 'add') {
      await product.increaseStock(quantity);
    } else if (operation === 'subtract') {
      await product.decreaseStock(quantity);
    }
    
    await product.save();
    
    return product;
  }
  
  async listProducts(filters = {}, page = 1, limit = 10) {
    const { skip, limit: paginationLimit } = paginate(page, limit);
    
    const query = {};
    
    if (filters.vendorId) {
      query.vendor = filters.vendorId;
    }
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.subcategory) {
      query.subcategory = filters.subcategory;
    }
    
    if (filters.isAvailable !== undefined) {
      query.isAvailable = filters.isAvailable;
    }
    
    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }
    
    if (filters.isNew !== undefined) {
      query.isNew = filters.isNew;
    }
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }
    
    let queryBuilder = Product.find(query)
      .populate('vendor', 'name logo rating')
      .skip(skip)
      .limit(paginationLimit);
    
    if (filters.search) {
      queryBuilder = queryBuilder.sort({ score: { $meta: 'textScore' } });
    } else if (filters.sortBy === 'price_asc') {
      queryBuilder = queryBuilder.sort({ price: 1 });
    } else if (filters.sortBy === 'price_desc') {
      queryBuilder = queryBuilder.sort({ price: -1 });
    } else if (filters.sortBy === 'rating') {
      queryBuilder = queryBuilder.sort({ 'rating.average': -1 });
    } else if (filters.sortBy === 'popular') {
      queryBuilder = queryBuilder.sort({ 'stats.orders': -1 });
    } else {
      queryBuilder = queryBuilder.sort({ isFeatured: -1, createdAt: -1 });
    }
    
    const [products, total] = await Promise.all([
      queryBuilder,
      Product.countDocuments(query)
    ]);
    
    return buildPaginationResponse(products, total, page, paginationLimit);
  }
  
  async getVendorProducts(vendorId, filters = {}, page = 1, limit = 10) {
    return await this.listProducts(
      { ...filters, vendorId },
      page,
      limit
    );
  }
  
  async searchProducts(searchTerm, filters = {}, page = 1, limit = 10) {
    return await this.listProducts(
      { ...filters, search: searchTerm },
      page,
      limit
    );
  }
  
  async deleteProduct(productId, vendorId) {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product.vendor.toString() !== vendorId) {
      throw new Error('Unauthorized');
    }
    
    product.isAvailable = false;
    await product.save();
    
    return { message: 'Product deleted successfully' };
  }
  
  async bulkUpdateProducts(vendorId, products) {
    const results = {
      successful: [],
      failed: []
    };
    
    for (const productData of products) {
      try {
        const product = await Product.findOne({
          _id: productData.id,
          vendor: vendorId
        });
        
        if (!product) {
          results.failed.push({
            id: productData.id,
            error: 'Product not found'
          });
          continue;
        }
        
        Object.keys(productData.updates).forEach(key => {
          product[key] = productData.updates[key];
        });
        
        await product.save();
        
        results.successful.push(product);
      } catch (error) {
        results.failed.push({
          id: productData.id,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new ProductService();
