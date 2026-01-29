# Parkent Express Middleware

This directory contains all middleware modules for the Parkent Express backend API. All middleware is production-ready with proper error handling, logging, and security features.

## 📦 Modules

### 1. **auth.middleware.js** - Authentication & Authorization

JWT-based authentication middleware with role-based access control.

#### Features:
- JWT token extraction and verification
- Role-based authorization
- Custom error handling
- Optional authentication support

#### Usage:

```javascript
const { verifyToken, requireRole, requireAdmin } = require('./middleware');

// Require authentication
app.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Require specific role
app.post('/products', verifyToken, requireRole(['vendor', 'admin']), (req, res) => {
  // Only vendors and admins can create products
});

// Pre-built role checkers
app.get('/admin/stats', verifyToken, requireAdmin, (req, res) => {
  // Only admins
});

app.get('/vendor/orders', verifyToken, requireVendor, (req, res) => {
  // Only vendors
});

// Optional authentication (doesn't fail if no token)
app.get('/products', optionalAuth, (req, res) => {
  // req.user will be set if token provided, otherwise undefined
});
```

#### Exports:
- `verifyToken` - Verify JWT and attach user to req.user
- `requireRole(roles)` - Factory for custom role requirements
- `requireAdmin` - Shortcut for admin-only routes
- `requireVendor` - Shortcut for vendor-only routes
- `requireCourier` - Shortcut for courier-only routes
- `requireCustomer` - Shortcut for customer-only routes
- `requireVendorOrAdmin` - Allow vendors or admins
- `requireCourierOrAdmin` - Allow couriers or admins
- `optionalAuth` - Optional authentication

---

### 2. **validator.js** - Request Validation

Joi-based request validation middleware with common schemas.

#### Features:
- Validate body, params, query, and headers
- Pre-built common validation schemas
- Detailed validation error messages
- Strip unknown fields automatically

#### Usage:

```javascript
const { validateBody, validateParams, Joi, commonSchemas } = require('./middleware');

// Validate request body
const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: commonSchemas.phone.required()
});

app.post('/users', validateBody(createUserSchema), (req, res) => {
  // req.body is validated and sanitized
});

// Validate params
const idParamSchema = Joi.object({
  id: commonSchemas.objectId.required()
});

app.get('/users/:id', validateParams(idParamSchema), (req, res) => {
  // req.params.id is validated
});

// Validate query
const paginationSchema = commonSchemas.pagination;

app.get('/users', validateQuery(paginationSchema), (req, res) => {
  // req.query.page and req.query.limit are validated with defaults
});
```

#### Common Schemas:
- `objectId` - MongoDB ObjectId validation
- `telegramId` - Telegram ID validation
- `phone` - Uzbekistan phone number (+998XXXXXXXXX)
- `pagination` - Page and limit with defaults
- `coordinates` - Latitude and longitude
- `dateRange` - Start and end date validation

#### Exports:
- `validate(schema, source)` - Generic validator
- `validateBody(schema)` - Validate req.body
- `validateParams(schema)` - Validate req.params
- `validateQuery(schema)` - Validate req.query
- `commonSchemas` - Pre-built validation schemas
- `Joi` - Joi instance for custom schemas
- `customJoi` - Extended Joi with custom rules

---

### 3. **errorHandler.js** - Error Handling

Global error handler with logging, admin notifications, and proper error responses.

#### Features:
- Centralized error handling
- Winston logging integration
- Admin notification for 500 errors via Telegram
- Stack traces in development only
- Async error handling support
- Different log levels for different errors

#### Usage:

```javascript
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware');

// Wrap async route handlers
app.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);
}));

// Register error handlers (MUST BE LAST)
app.use(notFoundHandler); // 404 handler
app.use(errorHandler);    // Global error handler
```

#### Error Response Format:

```json
{
  "error": {
    "name": "ValidationError",
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": [...],
    "timestamp": "2024-01-29T12:00:00.000Z",
    "stack": [...] // only in development
  }
}
```

#### Exports:
- `errorHandler` - Main error handling middleware
- `notFoundHandler` - 404 error handler
- `asyncHandler(fn)` - Wrapper for async route handlers
- `registerGlobalHandlers()` - Register process error handlers
- `logError(error, req)` - Log error with context
- `notifyAdmin(error, req)` - Send notification to admin

---

### 4. **rateLimit.js** - Rate Limiting

Express-rate-limit configuration with multiple limiters for different endpoints.

#### Features:
- Multiple pre-configured rate limiters
- IP-based and user-based rate limiting
- Automatic skip for admins
- Custom rate limit exceeded messages
- Standard headers (RateLimit-* headers)

#### Usage:

```javascript
const { 
  standardLimiter, 
  authLimiter, 
  apiLimiter,
  createLimiter 
} = require('./middleware');

// Apply standard limiter globally
app.use(standardLimiter); // 5 req/min per IP

// Auth endpoints - stricter limits
app.post('/auth/login', authLimiter, (req, res) => {
  // 5 requests per 5 minutes
});

// API endpoints
app.use('/api', apiLimiter); // 30 req/min

// Custom limiter
const customLimiter = createLimiter({
  windowMs: 60000,
  max: 10,
  message: 'Custom rate limit message'
});

app.post('/special', customLimiter, (req, res) => {
  // Custom rate limiting
});
```

#### Available Limiters:

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `standardLimiter` | 1 min | 5 | Default (from env) |
| `strictLimiter` | 1 min | 3 | Sensitive operations |
| `authLimiter` | 5 min | 5 | Login/register |
| `publicLimiter` | 1 min | 100 | Public endpoints |
| `apiLimiter` | 1 min | 30 | General API |
| `uploadLimiter` | 5 min | 5 | File uploads |
| `orderLimiter` | 1 hour | 10 | Order creation |

#### Exports:
- All limiters listed above
- `createLimiter(options)` - Create custom limiter
- `getRateLimitConfig()` - Get config from environment

---

## 🔧 Configuration

### Environment Variables

```env
# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000    # 1 minute in milliseconds
RATE_LIMIT_MAX_REQUESTS=5     # Max requests per window

# Admin Notifications
ADMIN_TELEGRAM_ID=123456789   # Admin Telegram ID for error notifications

# Environment
NODE_ENV=production           # production, development, test
```

---

## 🚀 Quick Start

### 1. Basic Setup

```javascript
const express = require('express');
const { 
  errorHandler, 
  notFoundHandler, 
  standardLimiter 
} = require('./middleware');

const app = express();

// Apply rate limiting
app.use(standardLimiter);

// Your routes here
app.use('/api', require('./routes'));

// Error handling (MUST BE LAST)
app.use(notFoundHandler);
app.use(errorHandler);
```

### 2. Protected Routes

```javascript
const { 
  verifyToken, 
  requireRole, 
  validateBody,
  asyncHandler 
} = require('./middleware');

// Protected route with validation
app.post('/orders', 
  verifyToken,
  requireRole(['customer']),
  validateBody(orderSchema),
  asyncHandler(async (req, res) => {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  })
);
```

### 3. Complete Example

```javascript
const express = require('express');
const {
  verifyToken,
  requireAdmin,
  requireVendor,
  validateBody,
  validateParams,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  apiLimiter,
  authLimiter,
  Joi,
  commonSchemas
} = require('./middleware');

const app = express();
app.use(express.json());

// Rate limiting
app.use('/api', apiLimiter);

// Public route
app.get('/api/products', asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.json(products);
}));

// Auth routes with strict rate limiting
app.post('/api/auth/login', 
  authLimiter,
  validateBody(Joi.object({
    phone: commonSchemas.phone.required(),
    code: Joi.string().required()
  })),
  asyncHandler(async (req, res) => {
    // Login logic
  })
);

// Protected vendor route
app.post('/api/vendor/products',
  verifyToken,
  requireVendor,
  validateBody(Joi.object({
    name: Joi.string().required(),
    price: Joi.number().positive().required()
  })),
  asyncHandler(async (req, res) => {
    // Create product logic
  })
);

// Admin only route
app.get('/api/admin/stats',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    // Admin stats logic
  })
);

// Error handling (MUST BE LAST)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(5000);
```

---

## 🧪 Testing

Run the test suite to verify all middleware:

```bash
node test-middleware.js
```

Expected output:
```
✅ All middleware tests passed!

📋 Summary:
   ✓ auth.middleware.js - JWT verification & role checking
   ✓ validator.js - Joi validation with common schemas
   ✓ errorHandler.js - Global error handling with logging & notifications
   ✓ rateLimit.js - Multiple rate limiters (5 req/min default)
   ✓ index.js - Centralized middleware exports

🎉 All middleware modules are production-ready!
```

---

## 🔒 Security Features

1. **JWT Verification**: Secure token validation with proper error handling
2. **Role-Based Access**: Prevent unauthorized access to protected resources
3. **Rate Limiting**: Prevent abuse and DDoS attacks
4. **Input Validation**: Sanitize and validate all user input
5. **Error Sanitization**: Hide sensitive data in production
6. **Admin Notifications**: Real-time alerts for critical errors
7. **Audit Logging**: All errors logged with Winston

---

## 📚 Best Practices

1. **Always use `asyncHandler`** for async routes to catch promise rejections
2. **Apply rate limiters** to prevent abuse
3. **Validate all inputs** using Joi schemas
4. **Register error handlers last** in middleware chain
5. **Use role-based access** for protected routes
6. **Monitor logs** for security issues
7. **Set proper environment variables** in production

---

## 🤝 Dependencies

- `express` - Web framework
- `jsonwebtoken` - JWT handling
- `joi` - Validation
- `express-rate-limit` - Rate limiting
- `winston` - Logging

---

## 📄 License

MIT License - Part of Parkent Express Delivery System
