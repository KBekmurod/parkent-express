const productService = require('../../services/productService');
const { asyncHandler } = require('../../utils/helpers');
const { HTTP_STATUS } = require('../../utils/constants');

const createProduct = asyncHandler(async (req, res) => {
  const Vendor = require('../../models/Vendor');
  const vendor = await Vendor.findOne({ owner: req.userId });
  
  if (!vendor) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: { message: 'Vendor not found' }
    });
  }
  
  const product = await productService.createProduct(vendor._id.toString(), req.body);
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { product }
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { product }
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const Vendor = require('../../models/Vendor');
  const vendor = await Vendor.findOne({ owner: req.userId });
  
  if (!vendor) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: { message: 'Vendor not found' }
    });
  }
  
  const product = await productService.updateProduct(req.params.id, vendor._id.toString(), req.body);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { product }
  });
});

const toggleProductAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  
  const Vendor = require('../../models/Vendor');
  const vendor = await Vendor.findOne({ owner: req.userId });
  
  if (!vendor) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: { message: 'Vendor not found' }
    });
  }
  
  const product = await productService.toggleProductAvailability(
    req.params.id,
    vendor._id.toString(),
    isAvailable
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { product }
  });
});

const updateStock = asyncHandler(async (req, res) => {
  const { quantity, operation } = req.body;
  
  const Vendor = require('../../models/Vendor');
  const vendor = await Vendor.findOne({ owner: req.userId });
  
  if (!vendor) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: { message: 'Vendor not found' }
    });
  }
  
  const product = await productService.updateStock(
    req.params.id,
    vendor._id.toString(),
    quantity,
    operation
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { product }
  });
});

const listProducts = asyncHandler(async (req, res) => {
  const {
    vendorId,
    category,
    subcategory,
    isAvailable,
    isFeatured,
    isNew,
    search,
    tags,
    minPrice,
    maxPrice,
    sortBy,
    page,
    limit
  } = req.query;
  
  const filters = {
    vendorId,
    category,
    subcategory,
    isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
    isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
    isNew: isNew === 'true' ? true : isNew === 'false' ? false : undefined,
    search,
    tags: tags ? tags.split(',') : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    sortBy
  };
  
  const result = await productService.listProducts(
    filters,
    parseInt(page) || 1,
    parseInt(limit) || 10
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result
  });
});

const getVendorProducts = asyncHandler(async (req, res) => {
  const { category, isAvailable, page, limit } = req.query;
  
  const result = await productService.getVendorProducts(
    req.params.vendorId,
    { category, isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined },
    parseInt(page) || 1,
    parseInt(limit) || 10
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result
  });
});

const searchProducts = asyncHandler(async (req, res) => {
  const { q, category, page, limit } = req.query;
  
  const result = await productService.searchProducts(
    q,
    { category },
    parseInt(page) || 1,
    parseInt(limit) || 10
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const Vendor = require('../../models/Vendor');
  const vendor = await Vendor.findOne({ owner: req.userId });
  
  if (!vendor) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: { message: 'Vendor not found' }
    });
  }
  
  const result = await productService.deleteProduct(req.params.id, vendor._id.toString());
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  toggleProductAvailability,
  updateStock,
  listProducts,
  getVendorProducts,
  searchProducts,
  deleteProduct
};
