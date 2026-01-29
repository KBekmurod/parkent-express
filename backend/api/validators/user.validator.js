const Joi = require('joi');
const { ROLES, REGEX } = require('../../config/constants');

// Parkent city bounds (approximate)
const PARKENT_BOUNDS = {
  LAT_MIN: 41.25,
  LAT_MAX: 41.35,
  LON_MIN: 69.65,
  LON_MAX: 69.75
};

const createUserSchema = Joi.object({
  phone: Joi.string()
    .pattern(REGEX.PHONE)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in format +998XXXXXXXXX',
      'any.required': 'Phone number is required'
    }),
  
  firstName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must not exceed 50 characters'
    }),
  
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .default(ROLES.CUSTOMER)
    .messages({
      'any.only': `Role must be one of: ${Object.values(ROLES).join(', ')}`
    }),
  
  telegramId: Joi.string()
    .pattern(REGEX.TELEGRAM_ID)
    .optional()
    .messages({
      'string.pattern.base': 'Telegram ID must be 5-15 digits'
    }),
  
  telegramUsername: Joi.string()
    .min(5)
    .max(32)
    .optional()
    .messages({
      'string.min': 'Telegram username must be at least 5 characters',
      'string.max': 'Telegram username must not exceed 32 characters'
    })
});

const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must not exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must not exceed 50 characters'
    }),
  
  phone: Joi.string()
    .pattern(REGEX.PHONE)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be in format +998XXXXXXXXX'
    }),
  
  telegramUsername: Joi.string()
    .min(5)
    .max(32)
    .optional()
    .messages({
      'string.min': 'Telegram username must be at least 5 characters',
      'string.max': 'Telegram username must not exceed 32 characters'
    }),
  
  isActive: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const updateLocationSchema = Joi.object({
  latitude: Joi.number()
    .min(PARKENT_BOUNDS.LAT_MIN)
    .max(PARKENT_BOUNDS.LAT_MAX)
    .required()
    .messages({
      'number.min': `Latitude must be within Parkent bounds (${PARKENT_BOUNDS.LAT_MIN} - ${PARKENT_BOUNDS.LAT_MAX})`,
      'number.max': `Latitude must be within Parkent bounds (${PARKENT_BOUNDS.LAT_MIN} - ${PARKENT_BOUNDS.LAT_MAX})`,
      'any.required': 'Latitude is required'
    }),
  
  longitude: Joi.number()
    .min(PARKENT_BOUNDS.LON_MIN)
    .max(PARKENT_BOUNDS.LON_MAX)
    .required()
    .messages({
      'number.min': `Longitude must be within Parkent bounds (${PARKENT_BOUNDS.LON_MIN} - ${PARKENT_BOUNDS.LON_MAX})`,
      'number.max': `Longitude must be within Parkent bounds (${PARKENT_BOUNDS.LON_MIN} - ${PARKENT_BOUNDS.LON_MAX})`,
      'any.required': 'Longitude is required'
    }),
  
  address: Joi.string()
    .min(5)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.min': 'Address must be at least 5 characters',
      'string.max': 'Address must not exceed 200 characters',
      'any.required': 'Address is required'
    }),
  
  addressUz: Joi.string()
    .min(5)
    .max(200)
    .trim()
    .optional()
    .messages({
      'string.min': 'Address (Uzbek) must be at least 5 characters',
      'string.max': 'Address (Uzbek) must not exceed 200 characters'
    })
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateLocationSchema
};
