/**
 * Middleware Usage Examples
 * Complete examples showing how to use all middleware modules
 */

const express = require('express');
const {
  // Authentication
  verifyToken,
  requireRole,
  requireAdmin,
  requireVendor,
  requireCourier,
  requireCustomer,
  optionalAuth,
  
  // Validation
  validateBody,
  validateParams,
  validateQuery,
  Joi,
  commonSchemas,
  
  // Error Handling
  errorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Rate Limiting
  standardLimiter,
  strictLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  orderLimiter,
  createLimiter
} = require('./middleware');

const app = express();
app.use(express.json());

// ============================================================================
// EXAMPLE 1: Public Routes with Optional Authentication
// ============================================================================

// Public product listing (no auth required, but user context available if provided)
app.get('/api/products', 
  optionalAuth,
  asyncHandler(async (req, res) => {
    // req.user will be set if valid token provided, undefined otherwise
    const products = await Product.find();
    
    // Can customize response based on user
    if (req.user) {
      // Add favorites or personalized data
    }
    
    res.json(products);
  })
);

// ============================================================================
// EXAMPLE 2: Authentication Required Routes
// ============================================================================

// Get user profile (authentication required)
app.get('/api/profile',
  verifyToken,
  asyncHandler(async (req, res) => {
    // req.user is guaranteed to exist here
    const user = await User.findById(req.user.userId);
    res.json(user);
  })
);

// ============================================================================
// EXAMPLE 3: Role-Based Access Control
// ============================================================================

// Admin-only route
app.get('/api/admin/stats',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const stats = await getAdminStats();
    res.json(stats);
  })
);

// Vendor-only route
app.post('/api/vendor/products',
  verifyToken,
  requireVendor,
  validateBody(Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().positive().required(),
    category: Joi.string().required(),
    image: Joi.string().uri()
  })),
  asyncHandler(async (req, res) => {
    const product = await Product.create({
      ...req.body,
      vendorId: req.user.userId
    });
    res.status(201).json(product);
  })
);

// Courier-only route
app.patch('/api/courier/location',
  verifyToken,
  requireCourier,
  validateBody(commonSchemas.coordinates),
  asyncHandler(async (req, res) => {
    await Courier.updateLocation(req.user.userId, req.body);
    res.json({ message: 'Location updated' });
  })
);

// Customer-only route
app.post('/api/customer/orders',
  verifyToken,
  requireCustomer,
  orderLimiter, // 10 orders per hour
  validateBody(Joi.object({
    vendorId: commonSchemas.objectId.required(),
    items: Joi.array().items(Joi.object({
      productId: commonSchemas.objectId.required(),
      quantity: Joi.number().integer().positive().required()
    })).min(1).required(),
    deliveryAddress: commonSchemas.coordinates.required(),
    notes: Joi.string().optional()
  })),
  asyncHandler(async (req, res) => {
    const order = await Order.create({
      ...req.body,
      customerId: req.user.userId
    });
    res.status(201).json(order);
  })
);

// Multiple roles allowed (vendor or admin)
app.delete('/api/products/:id',
  verifyToken,
  requireRole(['vendor', 'admin']),
  validateParams(Joi.object({
    id: commonSchemas.objectId.required()
  })),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    
    // Vendor can only delete their own products
    if (req.user.role === 'vendor' && product.vendorId !== req.user.userId) {
      throw new ForbiddenError('You can only delete your own products');
    }
    
    await product.remove();
    res.json({ message: 'Product deleted' });
  })
);

// ============================================================================
// EXAMPLE 4: Request Validation
// ============================================================================

// Validate request body
app.post('/api/users',
  validateBody(Joi.object({
    name: Joi.string().required(),
    phone: commonSchemas.phone.required(),
    telegramId: commonSchemas.telegramId.required()
  })),
  asyncHandler(async (req, res) => {
    // req.body is validated and sanitized
    const user = await User.create(req.body);
    res.status(201).json(user);
  })
);

// Validate URL params
app.get('/api/orders/:id',
  verifyToken,
  validateParams(Joi.object({
    id: commonSchemas.objectId.required()
  })),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    res.json(order);
  })
);

// Validate query parameters
app.get('/api/orders',
  verifyToken,
  validateQuery(Joi.object({
    ...commonSchemas.pagination,
    status: Joi.string().valid('pending', 'completed', 'cancelled'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  })),
  asyncHandler(async (req, res) => {
    const orders = await Order.find()
      .skip((req.query.page - 1) * req.query.limit)
      .limit(req.query.limit);
    res.json(orders);
  })
);

// ============================================================================
// EXAMPLE 5: Rate Limiting
// ============================================================================

// Apply global API rate limiter
app.use('/api', apiLimiter); // 30 requests per minute

// Auth routes with strict rate limiting
app.post('/api/auth/login',
  authLimiter, // 5 requests per 5 minutes
  validateBody(Joi.object({
    phone: commonSchemas.phone.required(),
    code: Joi.string().length(6).required()
  })),
  asyncHandler(async (req, res) => {
    // Login logic
  })
);

app.post('/api/auth/send-code',
  authLimiter, // 5 requests per 5 minutes
  validateBody(Joi.object({
    phone: commonSchemas.phone.required()
  })),
  asyncHandler(async (req, res) => {
    // Send verification code
  })
);

// File upload with strict rate limiting
app.post('/api/upload',
  verifyToken,
  uploadLimiter, // 5 uploads per 5 minutes
  asyncHandler(async (req, res) => {
    // File upload logic
  })
);

// Sensitive operation with custom rate limiting
const paymentLimiter = createLimiter({
  windowMs: 60000, // 1 minute
  max: 3,
  message: 'Too many payment attempts'
});

app.post('/api/payments',
  verifyToken,
  paymentLimiter,
  strictLimiter, // Additional protection
  validateBody(Joi.object({
    orderId: commonSchemas.objectId.required(),
    amount: Joi.number().positive().required(),
    method: Joi.string().valid('cash', 'card').required()
  })),
  asyncHandler(async (req, res) => {
    // Payment processing
  })
);

// ============================================================================
// EXAMPLE 6: Error Handling
// ============================================================================

// Async handler automatically catches promise rejections
app.get('/api/test/error',
  asyncHandler(async (req, res) => {
    // This error will be caught and passed to errorHandler
    throw new Error('Test error');
  })
);

// Custom error types
app.get('/api/test/custom-error',
  asyncHandler(async (req, res) => {
    const { NotFoundError, ValidationError } = require('./utils/errorTypes');
    
    // Throw custom errors
    if (!req.query.id) {
      throw new ValidationError('ID is required');
    }
    
    const item = await Item.findById(req.query.id);
    if (!item) {
      throw new NotFoundError('Item not found', 'Item');
    }
    
    res.json(item);
  })
);

// ============================================================================
// EXAMPLE 7: Complex Multi-Layer Protection
// ============================================================================

app.patch('/api/admin/users/:id/role',
  verifyToken,              // Must be authenticated
  requireAdmin,             // Must be admin
  strictLimiter,            // Max 3 requests per minute
  validateParams(Joi.object({
    id: commonSchemas.objectId.required()
  })),
  validateBody(Joi.object({
    role: Joi.string().valid('customer', 'vendor', 'courier', 'admin').required()
  })),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    user.role = req.body.role;
    await user.save();
    
    // Log admin action
    await AdminLog.create({
      adminId: req.user.userId,
      action: 'role_change',
      target: user._id,
      details: { oldRole: user.role, newRole: req.body.role }
    });
    
    res.json(user);
  })
);

// ============================================================================
// ERROR HANDLING (Must be registered LAST)
// ============================================================================

// 404 handler - catches all unmatched routes
app.use(notFoundHandler);

// Global error handler - catches all errors
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('🔒 Middleware active:');
  console.log('   • JWT Authentication');
  console.log('   • Role-based Authorization');
  console.log('   • Request Validation');
  console.log('   • Rate Limiting (5 req/min default)');
  console.log('   • Error Handling & Logging');
  console.log('   • Admin Notifications');
});

// Export for testing
module.exports = app;
