const Joi = require('joi');

// Parkent city bounds (approximate)
const PARKENT_BOUNDS = {
  LAT_MIN: 41.25,
  LAT_MAX: 41.35,
  LON_MIN: 69.65,
  LON_MAX: 69.75
};

// Vehicle types
const VEHICLE_TYPES = ['bicycle', 'motorcycle', 'car', 'scooter', 'foot'];

const createCourierSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'User ID must be a valid MongoDB ObjectId',
      'any.required': 'User ID is required'
    }),
  
  vehicleType: Joi.string()
    .valid(...VEHICLE_TYPES)
    .required()
    .messages({
      'any.only': `Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}`,
      'any.required': 'Vehicle type is required'
    }),
  
  vehicleNumber: Joi.string()
    .min(3)
    .max(20)
    .trim()
    .uppercase()
    .when('vehicleType', {
      is: Joi.valid('motorcycle', 'car', 'scooter'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'Vehicle number must be at least 3 characters',
      'string.max': 'Vehicle number must not exceed 20 characters',
      'any.required': 'Vehicle number is required for motorized vehicles'
    }),
  
  vehicleModel: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'Vehicle model must be at least 2 characters',
      'string.max': 'Vehicle model must not exceed 50 characters'
    }),
  
  vehicleColor: Joi.string()
    .min(3)
    .max(30)
    .trim()
    .optional()
    .messages({
      'string.min': 'Vehicle color must be at least 3 characters',
      'string.max': 'Vehicle color must not exceed 30 characters'
    }),
  
  licenseNumber: Joi.string()
    .min(5)
    .max(20)
    .trim()
    .uppercase()
    .when('vehicleType', {
      is: Joi.valid('motorcycle', 'car'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'License number must be at least 5 characters',
      'string.max': 'License number must not exceed 20 characters',
      'any.required': 'License number is required for motorcycle and car'
    }),
  
  licenseExpiry: Joi.date()
    .min('now')
    .when('licenseNumber', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'date.min': 'License expiry date must be in the future',
      'any.required': 'License expiry date is required when license number is provided'
    }),
  
  insuranceNumber: Joi.string()
    .min(5)
    .max(30)
    .trim()
    .optional()
    .messages({
      'string.min': 'Insurance number must be at least 5 characters',
      'string.max': 'Insurance number must not exceed 30 characters'
    }),
  
  insuranceExpiry: Joi.date()
    .min('now')
    .when('insuranceNumber', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'date.min': 'Insurance expiry date must be in the future',
      'any.required': 'Insurance expiry date is required when insurance number is provided'
    }),
  
  documents: Joi.object({
    idCard: Joi.string().uri().optional(),
    license: Joi.string().uri().optional(),
    vehicleRegistration: Joi.string().uri().optional(),
    insurance: Joi.string().uri().optional(),
    photo: Joi.string().uri().optional()
  }).optional().messages({
    'string.uri': 'Document must be a valid URI'
  }),
  
  emergencyContact: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Emergency contact name must be at least 2 characters',
        'string.max': 'Emergency contact name must not exceed 100 characters',
        'any.required': 'Emergency contact name is required'
      }),
    
    phone: Joi.string()
      .pattern(/^\+998[0-9]{9}$/)
      .required()
      .messages({
        'string.pattern.base': 'Emergency contact phone must be in format +998XXXXXXXXX',
        'any.required': 'Emergency contact phone is required'
      }),
    
    relationship: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'Relationship must be at least 2 characters',
        'string.max': 'Relationship must not exceed 50 characters'
      })
  }).optional(),
  
  isAvailable: Joi.boolean()
    .default(false),
  
  isOnline: Joi.boolean()
    .default(false)
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
  
  heading: Joi.number()
    .min(0)
    .max(360)
    .optional()
    .messages({
      'number.min': 'Heading must be between 0 and 360 degrees',
      'number.max': 'Heading must be between 0 and 360 degrees'
    }),
  
  speed: Joi.number()
    .min(0)
    .max(200)
    .optional()
    .messages({
      'number.min': 'Speed cannot be negative',
      'number.max': 'Speed must not exceed 200 km/h'
    }),
  
  accuracy: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.positive': 'Accuracy must be a positive number'
    })
});

const updateAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Availability status is required'
    }),
  
  isOnline: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Online status is required'
    }),
  
  reason: Joi.string()
    .max(200)
    .trim()
    .optional()
    .messages({
      'string.max': 'Reason must not exceed 200 characters'
    })
}).custom((value, helpers) => {
  // If courier is available, they must be online
  if (value.isAvailable && !value.isOnline) {
    return helpers.error('any.invalid', {
      message: 'Courier must be online to be available for deliveries'
    });
  }
  
  return value;
}, 'Availability validation');

const updateCourierSchema = Joi.object({
  vehicleType: Joi.string()
    .valid(...VEHICLE_TYPES)
    .optional()
    .messages({
      'any.only': `Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}`
    }),
  
  vehicleNumber: Joi.string()
    .min(3)
    .max(20)
    .trim()
    .uppercase()
    .optional()
    .messages({
      'string.min': 'Vehicle number must be at least 3 characters',
      'string.max': 'Vehicle number must not exceed 20 characters'
    }),
  
  vehicleModel: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'Vehicle model must be at least 2 characters',
      'string.max': 'Vehicle model must not exceed 50 characters'
    }),
  
  vehicleColor: Joi.string()
    .min(3)
    .max(30)
    .trim()
    .optional()
    .messages({
      'string.min': 'Vehicle color must be at least 3 characters',
      'string.max': 'Vehicle color must not exceed 30 characters'
    }),
  
  licenseNumber: Joi.string()
    .min(5)
    .max(20)
    .trim()
    .uppercase()
    .optional()
    .messages({
      'string.min': 'License number must be at least 5 characters',
      'string.max': 'License number must not exceed 20 characters'
    }),
  
  licenseExpiry: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'License expiry date must be in the future'
    }),
  
  insuranceNumber: Joi.string()
    .min(5)
    .max(30)
    .trim()
    .optional()
    .messages({
      'string.min': 'Insurance number must be at least 5 characters',
      'string.max': 'Insurance number must not exceed 30 characters'
    }),
  
  insuranceExpiry: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Insurance expiry date must be in the future'
    }),
  
  documents: Joi.object({
    idCard: Joi.string().uri().optional(),
    license: Joi.string().uri().optional(),
    vehicleRegistration: Joi.string().uri().optional(),
    insurance: Joi.string().uri().optional(),
    photo: Joi.string().uri().optional()
  }).optional().messages({
    'string.uri': 'Document must be a valid URI'
  }),
  
  emergencyContact: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Emergency contact name must be at least 2 characters',
        'string.max': 'Emergency contact name must not exceed 100 characters',
        'any.required': 'Emergency contact name is required'
      }),
    
    phone: Joi.string()
      .pattern(/^\+998[0-9]{9}$/)
      .required()
      .messages({
        'string.pattern.base': 'Emergency contact phone must be in format +998XXXXXXXXX',
        'any.required': 'Emergency contact phone is required'
      }),
    
    relationship: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'Relationship must be at least 2 characters',
        'string.max': 'Relationship must not exceed 50 characters'
      })
  }).optional(),
  
  isActive: Joi.boolean()
    .optional(),
  
  isVerified: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

module.exports = {
  createCourierSchema,
  updateLocationSchema,
  updateAvailabilitySchema,
  updateCourierSchema,
  VEHICLE_TYPES,
  PARKENT_BOUNDS
};
