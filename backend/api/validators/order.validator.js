const { body, param, query } = require('express-validator');

const createOrderValidator = [
  body('vendorId')
    .notEmpty().withMessage('Vendor ID is required')
    .isMongoId().withMessage('Invalid vendor ID'),
  body('items')
    .isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress')
    .isObject().withMessage('Delivery address is required'),
  body('deliveryAddress.street')
    .notEmpty().withMessage('Street is required'),
  body('deliveryAddress.location')
    .isObject().withMessage('Location is required'),
  body('deliveryAddress.location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'online']).withMessage('Invalid payment method')
];

const updateOrderStatusValidator = [
  param('id')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),
  body('status')
    .isIn([
      'pending', 'confirmed', 'preparing', 'ready', 'assigned',
      'picked_up', 'in_transit', 'delivered', 'cancelled', 'rejected'
    ]).withMessage('Invalid status')
];

const assignCourierValidator = [
  param('id')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),
  body('courierId')
    .notEmpty().withMessage('Courier ID is required')
    .isMongoId().withMessage('Invalid courier ID')
];

const cancelOrderValidator = [
  param('id')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),
  body('reason')
    .optional()
    .isString().withMessage('Reason must be a string')
];

const rateOrderValidator = [
  param('id')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),
  body('vendor')
    .optional()
    .isObject().withMessage('Vendor rating must be an object'),
  body('vendor.score')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Vendor score must be between 1 and 5'),
  body('courier')
    .optional()
    .isObject().withMessage('Courier rating must be an object'),
  body('courier.score')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Courier score must be between 1 and 5')
];

const getOrderValidator = [
  param('id')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID')
];

const listOrdersValidator = [
  query('status')
    .optional()
    .isIn([
      'pending', 'confirmed', 'preparing', 'ready', 'assigned',
      'picked_up', 'in_transit', 'delivered', 'cancelled', 'rejected'
    ]).withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

module.exports = {
  createOrderValidator,
  updateOrderStatusValidator,
  assignCourierValidator,
  cancelOrderValidator,
  rateOrderValidator,
  getOrderValidator,
  listOrdersValidator
};
