const Joi = require('joi');

// Product categories
const PRODUCT_CATEGORIES = [
  'food',
  'beverages',
  'grocery',
  'bakery',
  'dairy',
  'meat',
  'fruits',
  'vegetables',
  'snacks',
  'desserts',
  'other'
];

const createProductSchema = Joi.object({
  vendorId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Vendor ID must be a valid MongoDB ObjectId',
      'any.required': 'Vendor ID is required'
    }),
  
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name must not exceed 100 characters',
      'any.required': 'Product name is required'
    }),
  
  nameUz: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Product name (Uzbek) must be at least 2 characters',
      'string.max': 'Product name (Uzbek) must not exceed 100 characters',
      'any.required': 'Product name (Uzbek) is required'
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
  
  price: Joi.number()
    .positive()
    .max(100000000)
    .required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'number.max': 'Price must not exceed 100,000,000 UZS',
      'any.required': 'Price is required'
    }),
  
  originalPrice: Joi.number()
    .positive()
    .max(100000000)
    .greater(Joi.ref('price'))
    .optional()
    .messages({
      'number.positive': 'Original price must be a positive number',
      'number.max': 'Original price must not exceed 100,000,000 UZS',
      'number.greater': 'Original price must be greater than current price'
    }),
  
  category: Joi.string()
    .valid(...PRODUCT_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required'
    }),
  
  images: Joi.array()
    .items(
      Joi.string()
        .uri()
        .messages({
          'string.uri': 'Each image must be a valid URI'
        })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 images allowed per product'
    }),
  
  unit: Joi.string()
    .valid('piece', 'kg', 'gram', 'liter', 'ml', 'pack', 'portion')
    .default('piece')
    .messages({
      'any.only': 'Unit must be one of: piece, kg, gram, liter, ml, pack, portion'
    }),
  
  preparationTime: Joi.number()
    .integer()
    .min(0)
    .max(240)
    .optional()
    .messages({
      'number.min': 'Preparation time cannot be negative',
      'number.max': 'Preparation time must not exceed 240 minutes',
      'number.integer': 'Preparation time must be a whole number'
    }),
  
  isAvailable: Joi.boolean()
    .default(true),
  
  isFeatured: Joi.boolean()
    .default(false),
  
  tags: Joi.array()
    .items(
      Joi.string()
        .min(2)
        .max(30)
        .trim()
    )
    .max(20)
    .optional()
    .messages({
      'array.max': 'Maximum 20 tags allowed per product',
      'string.min': 'Each tag must be at least 2 characters',
      'string.max': 'Each tag must not exceed 30 characters'
    }),
  
  nutritionInfo: Joi.object({
    calories: Joi.number().positive().optional(),
    protein: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional()
  }).optional(),
  
  allergens: Joi.array()
    .items(
      Joi.string()
        .valid('nuts', 'dairy', 'gluten', 'eggs', 'soy', 'seafood', 'shellfish')
    )
    .optional()
    .messages({
      'any.only': 'Allergen must be one of: nuts, dairy, gluten, eggs, soy, seafood, shellfish'
    }),
  
  stockQuantity: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Stock quantity cannot be negative',
      'number.integer': 'Stock quantity must be a whole number'
    }),
  
  minOrderQuantity: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .default(1)
    .messages({
      'number.min': 'Minimum order quantity must be at least 1',
      'number.max': 'Minimum order quantity must not exceed 99',
      'number.integer': 'Minimum order quantity must be a whole number'
    }),
  
  maxOrderQuantity: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .optional()
    .messages({
      'number.min': 'Maximum order quantity must be at least 1',
      'number.max': 'Maximum order quantity must not exceed 99',
      'number.integer': 'Maximum order quantity must be a whole number'
    })
});

const updateProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name must not exceed 100 characters'
    }),
  
  nameUz: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Product name (Uzbek) must be at least 2 characters',
      'string.max': 'Product name (Uzbek) must not exceed 100 characters'
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
  
  price: Joi.number()
    .positive()
    .max(100000000)
    .optional()
    .messages({
      'number.positive': 'Price must be a positive number',
      'number.max': 'Price must not exceed 100,000,000 UZS'
    }),
  
  originalPrice: Joi.number()
    .positive()
    .max(100000000)
    .optional()
    .messages({
      'number.positive': 'Original price must be a positive number',
      'number.max': 'Original price must not exceed 100,000,000 UZS'
    }),
  
  category: Joi.string()
    .valid(...PRODUCT_CATEGORIES)
    .optional()
    .messages({
      'any.only': `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`
    }),
  
  images: Joi.array()
    .items(
      Joi.string()
        .uri()
        .messages({
          'string.uri': 'Each image must be a valid URI'
        })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 images allowed per product'
    }),
  
  unit: Joi.string()
    .valid('piece', 'kg', 'gram', 'liter', 'ml', 'pack', 'portion')
    .optional()
    .messages({
      'any.only': 'Unit must be one of: piece, kg, gram, liter, ml, pack, portion'
    }),
  
  preparationTime: Joi.number()
    .integer()
    .min(0)
    .max(240)
    .optional()
    .messages({
      'number.min': 'Preparation time cannot be negative',
      'number.max': 'Preparation time must not exceed 240 minutes',
      'number.integer': 'Preparation time must be a whole number'
    }),
  
  isAvailable: Joi.boolean()
    .optional(),
  
  isFeatured: Joi.boolean()
    .optional(),
  
  tags: Joi.array()
    .items(
      Joi.string()
        .min(2)
        .max(30)
        .trim()
    )
    .max(20)
    .optional()
    .messages({
      'array.max': 'Maximum 20 tags allowed per product',
      'string.min': 'Each tag must be at least 2 characters',
      'string.max': 'Each tag must not exceed 30 characters'
    }),
  
  nutritionInfo: Joi.object({
    calories: Joi.number().positive().optional(),
    protein: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional()
  }).optional(),
  
  allergens: Joi.array()
    .items(
      Joi.string()
        .valid('nuts', 'dairy', 'gluten', 'eggs', 'soy', 'seafood', 'shellfish')
    )
    .optional()
    .messages({
      'any.only': 'Allergen must be one of: nuts, dairy, gluten, eggs, soy, seafood, shellfish'
    }),
  
  stockQuantity: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Stock quantity cannot be negative',
      'number.integer': 'Stock quantity must be a whole number'
    }),
  
  minOrderQuantity: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .optional()
    .messages({
      'number.min': 'Minimum order quantity must be at least 1',
      'number.max': 'Minimum order quantity must not exceed 99',
      'number.integer': 'Minimum order quantity must be a whole number'
    }),
  
  maxOrderQuantity: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .optional()
    .messages({
      'number.min': 'Maximum order quantity must be at least 1',
      'number.max': 'Maximum order quantity must not exceed 99',
      'number.integer': 'Maximum order quantity must be a whole number'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const updateAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Availability status is required'
    }),
  
  reason: Joi.string()
    .max(200)
    .trim()
    .optional()
    .messages({
      'string.max': 'Reason must not exceed 200 characters'
    })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateAvailabilitySchema,
  PRODUCT_CATEGORIES
};
