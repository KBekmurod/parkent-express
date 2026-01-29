const { body, param, query } = require('express-validator');

const createVendorValidator = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category')
    .isIn(['restaurant', 'cafe', 'grocery', 'pharmacy', 'electronics', 'clothing', 'other'])
    .withMessage('Invalid category'),
  body('address.street')
    .notEmpty().withMessage('Street address is required'),
  body('address.location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('contact.phone')
    .notEmpty().withMessage('Phone is required')
    .matches(/^\+998[0-9]{9}$/).withMessage('Invalid phone format'),
  body('workingHours')
    .isArray().withMessage('Working hours must be an array')
];

const updateVendorValidator = [
  param('id')
    .notEmpty().withMessage('Vendor ID is required')
    .isMongoId().withMessage('Invalid vendor ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description')
    .optional()
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
];

const toggleVendorStatusValidator = [
  param('id')
    .notEmpty().withMessage('Vendor ID is required')
    .isMongoId().withMessage('Invalid vendor ID'),
  body('isActive')
    .isBoolean().withMessage('isActive must be boolean')
];

const toggleAcceptOrdersValidator = [
  param('id')
    .notEmpty().withMessage('Vendor ID is required')
    .isMongoId().withMessage('Invalid vendor ID'),
  body('acceptsOrders')
    .isBoolean().withMessage('acceptsOrders must be boolean')
];

const getVendorValidator = [
  param('id')
    .notEmpty().withMessage('Vendor ID is required')
    .isMongoId().withMessage('Invalid vendor ID')
];

const listVendorsValidator = [
  query('category')
    .optional()
    .isIn(['restaurant', 'cafe', 'grocery', 'pharmacy', 'electronics', 'clothing', 'other'])
    .withMessage('Invalid category'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const findNearbyVendorsValidator = [
  query('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('maxDistance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Max distance must be positive')
];

const suspendVendorValidator = [
  param('id')
    .notEmpty().withMessage('Vendor ID is required')
    .isMongoId().withMessage('Invalid vendor ID'),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isString().withMessage('Reason must be a string')
];

module.exports = {
  createVendorValidator,
  updateVendorValidator,
  toggleVendorStatusValidator,
  toggleAcceptOrdersValidator,
  getVendorValidator,
  listVendorsValidator,
  findNearbyVendorsValidator,
  suspendVendorValidator
};
