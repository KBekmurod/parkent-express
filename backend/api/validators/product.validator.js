const { body, param, query } = require('express-validator');

const createProductValidator = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isString().withMessage('Category must be a string'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be positive')
];

const updateProductValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be positive')
];

const toggleProductAvailabilityValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  body('isAvailable')
    .isBoolean().withMessage('isAvailable must be boolean')
];

const updateStockValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('operation')
    .optional()
    .isIn(['set', 'add', 'subtract']).withMessage('Invalid operation')
];

const getProductValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID')
];

const listProductsValidator = [
  query('vendorId')
    .optional()
    .isMongoId().withMessage('Invalid vendor ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Max price must be positive')
];

const getVendorProductsValidator = [
  param('vendorId')
    .notEmpty().withMessage('Vendor ID is required')
    .isMongoId().withMessage('Invalid vendor ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const searchProductsValidator = [
  query('q')
    .notEmpty().withMessage('Search query is required')
    .isString().withMessage('Search query must be a string'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

module.exports = {
  createProductValidator,
  updateProductValidator,
  toggleProductAvailabilityValidator,
  updateStockValidator,
  getProductValidator,
  listProductsValidator,
  getVendorProductsValidator,
  searchProductsValidator
};
