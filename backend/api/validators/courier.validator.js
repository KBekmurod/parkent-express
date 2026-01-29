const { body, param, query } = require('express-validator');

const registerCourierValidator = [
  body('vehicle.type')
    .isIn(['bicycle', 'motorcycle', 'scooter', 'car'])
    .withMessage('Invalid vehicle type'),
  body('vehicle.plateNumber')
    .optional()
    .isString().withMessage('Plate number must be a string'),
  body('documents.identityCard.number')
    .notEmpty().withMessage('Identity card number is required'),
  body('documents.driverLicense.number')
    .notEmpty().withMessage('Driver license number is required')
];

const updateCourierValidator = [
  body('vehicle')
    .optional()
    .isObject().withMessage('Vehicle must be an object'),
  body('bankDetails')
    .optional()
    .isObject().withMessage('Bank details must be an object')
];

const updateLocationValidator = [
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('accuracy')
    .optional()
    .isFloat({ min: 0 }).withMessage('Accuracy must be positive'),
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0 and 360'),
  body('speed')
    .optional()
    .isFloat({ min: 0 }).withMessage('Speed must be positive')
];

const getCourierValidator = [
  param('id')
    .notEmpty().withMessage('Courier ID is required')
    .isMongoId().withMessage('Invalid courier ID')
];

const listCouriersValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'active', 'inactive', 'suspended', 'rejected'])
    .withMessage('Invalid status'),
  query('vehicleType')
    .optional()
    .isIn(['bicycle', 'motorcycle', 'scooter', 'car'])
    .withMessage('Invalid vehicle type'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const findAvailableCouriersValidator = [
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

const rejectCourierValidator = [
  param('id')
    .notEmpty().withMessage('Courier ID is required')
    .isMongoId().withMessage('Invalid courier ID'),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isString().withMessage('Reason must be a string')
];

const suspendCourierValidator = [
  param('id')
    .notEmpty().withMessage('Courier ID is required')
    .isMongoId().withMessage('Invalid courier ID'),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isString().withMessage('Reason must be a string')
];

const verifyDocumentValidator = [
  param('id')
    .notEmpty().withMessage('Courier ID is required')
    .isMongoId().withMessage('Invalid courier ID'),
  body('documentType')
    .isIn(['identityCard', 'driverLicense', 'backgroundCheck'])
    .withMessage('Invalid document type')
];

const withdrawEarningsValidator = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0 }).withMessage('Amount must be positive')
];

module.exports = {
  registerCourierValidator,
  updateCourierValidator,
  updateLocationValidator,
  getCourierValidator,
  listCouriersValidator,
  findAvailableCouriersValidator,
  rejectCourierValidator,
  suspendCourierValidator,
  verifyDocumentValidator,
  withdrawEarningsValidator
};
