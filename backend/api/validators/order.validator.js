const Joi = require('joi');
const { ORDER_STATUSES, ORDER_STATUS_FLOW, PAYMENT_TYPES } = require('../../config/constants');

// Parkent city bounds (approximate)
const PARKENT_BOUNDS = {
  LAT_MIN: 41.25,
  LAT_MAX: 41.35,
  LON_MIN: 69.65,
  LON_MAX: 69.75
};

const createOrderSchema = Joi.object({
  customerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Customer ID must be a valid MongoDB ObjectId',
      'any.required': 'Customer ID is required'
    }),
  
  vendorId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Vendor ID must be a valid MongoDB ObjectId',
      'any.required': 'Vendor ID is required'
    }),
  
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
            'any.required': 'Product ID is required'
          }),
        
        quantity: Joi.number()
          .integer()
          .min(1)
          .max(99)
          .required()
          .messages({
            'number.min': 'Quantity must be at least 1',
            'number.max': 'Quantity must not exceed 99',
            'number.integer': 'Quantity must be a whole number',
            'any.required': 'Quantity is required'
          }),
        
        price: Joi.number()
          .positive()
          .optional()
          .messages({
            'number.positive': 'Price must be a positive number'
          }),
        
        notes: Joi.string()
          .max(200)
          .trim()
          .optional()
          .messages({
            'string.max': 'Notes must not exceed 200 characters'
          })
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'array.max': 'Maximum 50 items allowed per order',
      'any.required': 'Items are required'
    }),
  
  deliveryLocation: Joi.object({
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
        'string.min': 'Delivery address must be at least 5 characters',
        'string.max': 'Delivery address must not exceed 200 characters',
        'any.required': 'Delivery address is required'
      }),
    
    addressUz: Joi.string()
      .min(5)
      .max(200)
      .trim()
      .optional()
      .messages({
        'string.min': 'Delivery address (Uzbek) must be at least 5 characters',
        'string.max': 'Delivery address (Uzbek) must not exceed 200 characters'
      })
  }).required().messages({
    'any.required': 'Delivery location is required'
  }),
  
  paymentType: Joi.string()
    .valid(...Object.values(PAYMENT_TYPES))
    .required()
    .messages({
      'any.only': `Payment type must be one of: ${Object.values(PAYMENT_TYPES).join(', ')}`,
      'any.required': 'Payment type is required'
    }),
  
  deliveryInstructions: Joi.string()
    .max(500)
    .trim()
    .optional()
    .messages({
      'string.max': 'Delivery instructions must not exceed 500 characters'
    }),
  
  contactPhone: Joi.string()
    .pattern(/^\+998[0-9]{9}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Contact phone must be in format +998XXXXXXXXX'
    })
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUSES))
    .required()
    .messages({
      'any.only': `Status must be one of: ${Object.values(ORDER_STATUSES).join(', ')}`,
      'any.required': 'Status is required'
    }),
  
  currentStatus: Joi.string()
    .valid(...Object.values(ORDER_STATUSES))
    .optional(),
  
  reason: Joi.string()
    .max(500)
    .trim()
    .when('status', {
      is: ORDER_STATUSES.CANCELLED,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.max': 'Reason must not exceed 500 characters',
      'any.required': 'Cancellation reason is required'
    })
}).custom((value, helpers) => {
  const { status, currentStatus } = value;
  
  if (currentStatus) {
    const allowedTransitions = ORDER_STATUS_FLOW[currentStatus];
    
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      return helpers.error('any.invalid', {
        message: `Invalid status transition from ${currentStatus} to ${status}. Allowed: ${allowedTransitions?.join(', ') || 'none'}`
      });
    }
  }
  
  return value;
}, 'Status transition validation');

const assignCourierSchema = Joi.object({
  courierId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Courier ID must be a valid MongoDB ObjectId',
      'any.required': 'Courier ID is required'
    }),
  
  estimatedPickupTime: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Estimated pickup time must be in the future'
    }),
  
  estimatedDeliveryTime: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Estimated delivery time must be in the future'
    })
});

const rateOrderSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be between 1 and 5',
      'number.max': 'Rating must be between 1 and 5',
      'number.integer': 'Rating must be a whole number',
      'any.required': 'Rating is required'
    }),
  
  vendorRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Vendor rating must be between 1 and 5',
      'number.max': 'Vendor rating must be between 1 and 5',
      'number.integer': 'Vendor rating must be a whole number'
    }),
  
  courierRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Courier rating must be between 1 and 5',
      'number.max': 'Courier rating must be between 1 and 5',
      'number.integer': 'Courier rating must be a whole number'
    }),
  
  feedback: Joi.string()
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.max': 'Feedback must not exceed 1000 characters'
    }),
  
  vendorFeedback: Joi.string()
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.max': 'Vendor feedback must not exceed 1000 characters'
    }),
  
  courierFeedback: Joi.string()
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.max': 'Courier feedback must not exceed 1000 characters'
    })
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  assignCourierSchema,
  rateOrderSchema
};
