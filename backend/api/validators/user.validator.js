const { body, param, query } = require('express-validator');

const updateUserValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name must be max 50 characters'),
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format'),
  body('language')
    .optional()
    .isIn(['uz', 'ru', 'en']).withMessage('Invalid language')
];

const updateLocationValidator = [
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),
  body('address.street')
    .optional()
    .isString().withMessage('Street must be a string'),
  body('address.city')
    .optional()
    .isString().withMessage('City must be a string')
];

const updateNotificationSettingsValidator = [
  body('orderUpdates')
    .optional()
    .isBoolean().withMessage('Order updates must be boolean'),
  body('promotions')
    .optional()
    .isBoolean().withMessage('Promotions must be boolean'),
  body('telegram')
    .optional()
    .isBoolean().withMessage('Telegram must be boolean')
];

const getUserValidator = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID')
];

const listUsersValidator = [
  query('role')
    .optional()
    .isIn(['customer', 'vendor', 'courier', 'admin']).withMessage('Invalid role'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

module.exports = {
  updateUserValidator,
  updateLocationValidator,
  updateNotificationSettingsValidator,
  getUserValidator,
  listUsersValidator
};
