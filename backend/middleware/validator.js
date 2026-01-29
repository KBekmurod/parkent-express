const Joi = require('joi');
const { ValidationError } = require('../utils/errorTypes');

/**
 * Middleware factory to validate request data against Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  if (!schema || !schema.validate) {
    throw new Error('validate: A valid Joi schema is required');
  }

  const validSources = ['body', 'params', 'query', 'headers'];
  if (!validSources.includes(source)) {
    throw new Error(`validate: source must be one of ${validSources.join(', ')}`);
  }

  return (req, res, next) => {
    try {
      const dataToValidate = req[source];

      if (!dataToValidate) {
        throw new ValidationError(`No ${source} data to validate`);
      }

      const options = {
        abortEarly: false,
        stripUnknown: true,
        errors: {
          wrap: {
            label: ''
          }
        }
      };

      const { error, value } = schema.validate(dataToValidate, options);

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        throw new ValidationError('Validation failed', details);
      }

      req[source] = value;
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        next(new ValidationError(error.message));
      }
    }
  };
};

/**
 * Validate request body
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate request params
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate request query
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Common validation schemas
 */
const commonSchemas = {
  // MongoDB ObjectId validation
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .message('Invalid ObjectId format'),

  // Telegram ID validation
  telegramId: Joi.string()
    .pattern(/^[0-9]{5,15}$/)
    .message('Invalid Telegram ID format'),

  // Phone number validation (Uzbekistan format)
  phone: Joi.string()
    .pattern(/^\+998[0-9]{9}$/)
    .message('Invalid phone number. Format: +998XXXXXXXXX'),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // Coordinates
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  })
};

/**
 * Custom Joi extensions
 */
const customJoi = Joi.extend((joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.objectId': '{{#label}} must be a valid ObjectId'
  },
  rules: {
    objectId: {
      validate(value, helpers) {
        if (!/^[0-9a-fA-F]{24}$/.test(value)) {
          return helpers.error('string.objectId');
        }
        return value;
      }
    }
  }
}));

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  commonSchemas,
  customJoi,
  Joi
};
