const Joi = require('joi');
const { REGEX } = require('../../config/constants');

// Parkent city bounds (approximate)
const PARKENT_BOUNDS = {
  LAT_MIN: 41.25,
  LAT_MAX: 41.35,
  LON_MIN: 69.65,
  LON_MAX: 69.75
};

// Days of the week
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const workingHoursSchema = Joi.object({
  isOpen: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Open status is required'
    }),
  
  openTime: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .when('isOpen', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.pattern.base': 'Open time must be in format HH:MM (24-hour format)',
      'any.required': 'Open time is required when vendor is open'
    }),
  
  closeTime: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .when('isOpen', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.pattern.base': 'Close time must be in format HH:MM (24-hour format)',
      'any.required': 'Close time is required when vendor is open'
    })
});

const createVendorSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Vendor name must be at least 2 characters',
      'string.max': 'Vendor name must not exceed 100 characters',
      'any.required': 'Vendor name is required'
    }),
  
  nameUz: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Vendor name (Uzbek) must be at least 2 characters',
      'string.max': 'Vendor name (Uzbek) must not exceed 100 characters',
      'any.required': 'Vendor name (Uzbek) is required'
    }),
  
  description: Joi.string()
    .min(10)
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 1000 characters'
    }),
  
  descriptionUz: Joi.string()
    .min(10)
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.min': 'Description (Uzbek) must be at least 10 characters',
      'string.max': 'Description (Uzbek) must not exceed 1000 characters'
    }),
  
  location: Joi.object({
    type: Joi.string()
      .valid('Point')
      .default('Point'),
    
    coordinates: Joi.array()
      .ordered(
        Joi.number()
          .min(PARKENT_BOUNDS.LON_MIN)
          .max(PARKENT_BOUNDS.LON_MAX)
          .required()
          .messages({
            'number.min': `Longitude must be within Parkent bounds (${PARKENT_BOUNDS.LON_MIN} - ${PARKENT_BOUNDS.LON_MAX})`,
            'number.max': `Longitude must be within Parkent bounds (${PARKENT_BOUNDS.LON_MIN} - ${PARKENT_BOUNDS.LON_MAX})`
          }),
        Joi.number()
          .min(PARKENT_BOUNDS.LAT_MIN)
          .max(PARKENT_BOUNDS.LAT_MAX)
          .required()
          .messages({
            'number.min': `Latitude must be within Parkent bounds (${PARKENT_BOUNDS.LAT_MIN} - ${PARKENT_BOUNDS.LAT_MAX})`,
            'number.max': `Latitude must be within Parkent bounds (${PARKENT_BOUNDS.LAT_MIN} - ${PARKENT_BOUNDS.LAT_MAX})`
          })
      )
      .length(2)
      .required()
      .messages({
        'array.length': 'Coordinates must contain exactly 2 values [longitude, latitude]',
        'any.required': 'Coordinates are required'
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
  }).required().messages({
    'any.required': 'Location is required'
  }),
  
  phone: Joi.string()
    .pattern(REGEX.PHONE)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in format +998XXXXXXXXX',
      'any.required': 'Phone number is required'
    }),
  
  alternativePhone: Joi.string()
    .pattern(REGEX.PHONE)
    .optional()
    .messages({
      'string.pattern.base': 'Alternative phone number must be in format +998XXXXXXXXX'
    }),
  
  workingHours: Joi.object({
    monday: workingHoursSchema.required(),
    tuesday: workingHoursSchema.required(),
    wednesday: workingHoursSchema.required(),
    thursday: workingHoursSchema.required(),
    friday: workingHoursSchema.required(),
    saturday: workingHoursSchema.required(),
    sunday: workingHoursSchema.required()
  }).required().messages({
    'any.required': 'Working hours for all 7 days are required'
  }),
  
  ownerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Owner ID must be a valid MongoDB ObjectId',
      'any.required': 'Owner ID is required'
    }),
  
  logo: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Logo must be a valid URI'
    }),
  
  coverImage: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Cover image must be a valid URI'
    }),
  
  categories: Joi.array()
    .items(
      Joi.string()
        .min(2)
        .max(50)
        .trim()
    )
    .min(1)
    .max(10)
    .optional()
    .messages({
      'array.min': 'At least one category is required',
      'array.max': 'Maximum 10 categories allowed',
      'string.min': 'Category must be at least 2 characters',
      'string.max': 'Category must not exceed 50 characters'
    }),
  
  minimumOrder: Joi.number()
    .min(0)
    .max(1000000)
    .default(0)
    .messages({
      'number.min': 'Minimum order cannot be negative',
      'number.max': 'Minimum order must not exceed 1,000,000 UZS'
    }),
  
  deliveryFee: Joi.number()
    .min(0)
    .max(100000)
    .default(0)
    .messages({
      'number.min': 'Delivery fee cannot be negative',
      'number.max': 'Delivery fee must not exceed 100,000 UZS'
    }),
  
  estimatedDeliveryTime: Joi.number()
    .integer()
    .min(10)
    .max(180)
    .optional()
    .messages({
      'number.min': 'Estimated delivery time must be at least 10 minutes',
      'number.max': 'Estimated delivery time must not exceed 180 minutes',
      'number.integer': 'Estimated delivery time must be a whole number'
    }),
  
  isActive: Joi.boolean()
    .default(true)
});

const updateVendorSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Vendor name must be at least 2 characters',
      'string.max': 'Vendor name must not exceed 100 characters'
    }),
  
  nameUz: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Vendor name (Uzbek) must be at least 2 characters',
      'string.max': 'Vendor name (Uzbek) must not exceed 100 characters'
    }),
  
  description: Joi.string()
    .min(10)
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 1000 characters'
    }),
  
  descriptionUz: Joi.string()
    .min(10)
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.min': 'Description (Uzbek) must be at least 10 characters',
      'string.max': 'Description (Uzbek) must not exceed 1000 characters'
    }),
  
  location: Joi.object({
    type: Joi.string()
      .valid('Point')
      .default('Point'),
    
    coordinates: Joi.array()
      .ordered(
        Joi.number()
          .min(PARKENT_BOUNDS.LON_MIN)
          .max(PARKENT_BOUNDS.LON_MAX)
          .required()
          .messages({
            'number.min': `Longitude must be within Parkent bounds (${PARKENT_BOUNDS.LON_MIN} - ${PARKENT_BOUNDS.LON_MAX})`,
            'number.max': `Longitude must be within Parkent bounds (${PARKENT_BOUNDS.LON_MIN} - ${PARKENT_BOUNDS.LON_MAX})`
          }),
        Joi.number()
          .min(PARKENT_BOUNDS.LAT_MIN)
          .max(PARKENT_BOUNDS.LAT_MAX)
          .required()
          .messages({
            'number.min': `Latitude must be within Parkent bounds (${PARKENT_BOUNDS.LAT_MIN} - ${PARKENT_BOUNDS.LAT_MAX})`,
            'number.max': `Latitude must be within Parkent bounds (${PARKENT_BOUNDS.LAT_MIN} - ${PARKENT_BOUNDS.LAT_MAX})`
          })
      )
      .length(2)
      .required()
      .messages({
        'array.length': 'Coordinates must contain exactly 2 values [longitude, latitude]',
        'any.required': 'Coordinates are required'
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
  }).optional(),
  
  phone: Joi.string()
    .pattern(REGEX.PHONE)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be in format +998XXXXXXXXX'
    }),
  
  alternativePhone: Joi.string()
    .pattern(REGEX.PHONE)
    .optional()
    .messages({
      'string.pattern.base': 'Alternative phone number must be in format +998XXXXXXXXX'
    }),
  
  workingHours: Joi.object({
    monday: workingHoursSchema.optional(),
    tuesday: workingHoursSchema.optional(),
    wednesday: workingHoursSchema.optional(),
    thursday: workingHoursSchema.optional(),
    friday: workingHoursSchema.optional(),
    saturday: workingHoursSchema.optional(),
    sunday: workingHoursSchema.optional()
  }).optional(),
  
  logo: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Logo must be a valid URI'
    }),
  
  coverImage: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Cover image must be a valid URI'
    }),
  
  categories: Joi.array()
    .items(
      Joi.string()
        .min(2)
        .max(50)
        .trim()
    )
    .min(1)
    .max(10)
    .optional()
    .messages({
      'array.min': 'At least one category is required',
      'array.max': 'Maximum 10 categories allowed',
      'string.min': 'Category must be at least 2 characters',
      'string.max': 'Category must not exceed 50 characters'
    }),
  
  minimumOrder: Joi.number()
    .min(0)
    .max(1000000)
    .optional()
    .messages({
      'number.min': 'Minimum order cannot be negative',
      'number.max': 'Minimum order must not exceed 1,000,000 UZS'
    }),
  
  deliveryFee: Joi.number()
    .min(0)
    .max(100000)
    .optional()
    .messages({
      'number.min': 'Delivery fee cannot be negative',
      'number.max': 'Delivery fee must not exceed 100,000 UZS'
    }),
  
  estimatedDeliveryTime: Joi.number()
    .integer()
    .min(10)
    .max(180)
    .optional()
    .messages({
      'number.min': 'Estimated delivery time must be at least 10 minutes',
      'number.max': 'Estimated delivery time must not exceed 180 minutes',
      'number.integer': 'Estimated delivery time must be a whole number'
    }),
  
  isActive: Joi.boolean()
    .optional(),
  
  isVerified: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

module.exports = {
  createVendorSchema,
  updateVendorSchema,
  workingHoursSchema,
  PARKENT_BOUNDS,
  DAYS_OF_WEEK
};
