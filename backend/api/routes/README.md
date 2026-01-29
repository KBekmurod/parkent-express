# API Routes

This directory contains all the API route definitions for the Parkent Express backend.

## Files

- `auth.routes.js` - Authentication endpoints
- `users.routes.js` - User management (admin only)
- `orders.routes.js` - Order operations
- `vendors.routes.js` - Vendor management
- `couriers.routes.js` - Courier operations
- `products.routes.js` - Product CRUD
- `stats.routes.js` - Statistics and analytics
- `index.js` - Central export point

## Usage

```javascript
const routes = require('./api/routes');

app.use('/api/auth', routes.authRoutes);
app.use('/api/users', routes.usersRoutes);
app.use('/api/orders', routes.ordersRoutes);
app.use('/api/vendors', routes.vendorsRoutes);
app.use('/api/couriers', routes.couriersRoutes);
app.use('/api/products', routes.productsRoutes);
app.use('/api/stats', routes.statsRoutes);
```

## Features

- ✅ Express Router for modular route definitions
- ✅ JWT authentication middleware
- ✅ Role-based access control (Admin, Vendor, Courier, Customer)
- ✅ Request validation with Joi schemas
- ✅ Rate limiting for security
- ✅ All routes connected to existing controllers
- ✅ No placeholders - production ready

## Middleware Chain

Routes follow this middleware chain:
1. Rate limiter (authLimiter, apiLimiter, orderLimiter)
2. Authentication (verifyToken)
3. Authorization (requireAdmin, requireVendor, etc.)
4. Validation (validateBody with Joi schemas)
5. Controller handler

See `ROUTES_SUMMARY.md` for detailed endpoint documentation.
