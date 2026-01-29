# API Controllers

All controllers for Parkent Express backend API. Each controller follows consistent patterns:
- Uses async/await for all methods
- Calls appropriate services for business logic
- Uses next(error) for error handling
- Returns consistent JSON responses: `{success, data, message}`
- Implements proper logging with winston logger

## Controllers

### 1. auth.controller.js
Authentication and authorization controller.

**Methods:**
- `login(req, res, next)` - Generate JWT for admin login
- `verifyToken(req, res, next)` - Verify JWT and return user info

### 2. users.controller.js
User management controller.

**Methods:**
- `getAllUsers(req, res, next)` - Get all users with pagination and filters (role, isActive, search)
- `getUserById(req, res, next)` - Get user by ID
- `createUser(req, res, next)` - Create new user
- `updateUser(req, res, next)` - Update user information
- `deleteUser(req, res, next)` - Delete user

### 3. orders.controller.js
Order management controller.

**Methods:**
- `getAllOrders(req, res, next)` - Get all orders with filters (status, vendorId, courierId, customerId) and pagination
- `getOrderById(req, res, next)` - Get order by ID
- `createOrder(req, res, next)` - Create new order using orderService.createOrder
- `updateOrderStatus(req, res, next)` - Update order status using orderService.updateOrderStatus
- `assignCourier(req, res, next)` - Assign courier to order
- `cancelOrder(req, res, next)` - Cancel order with reason
- `rateOrder(req, res, next)` - Rate completed order

### 4. vendors.controller.js
Vendor management controller.

**Methods:**
- `getAllVendors(req, res, next)` - Get all vendors with filters (isActive, search) and pagination
- `getVendorById(req, res, next)` - Get vendor by ID
- `createVendor(req, res, next)` - Create new vendor
- `updateVendor(req, res, next)` - Update vendor information
- `toggleVendorStatus(req, res, next)` - Toggle vendor pause/resume status

### 5. couriers.controller.js
Courier management controller.

**Methods:**
- `getAllCouriers(req, res, next)` - Get all couriers with filters (isAvailable, isOnline) and pagination
- `getCourierById(req, res, next)` - Get courier by ID
- `createCourier(req, res, next)` - Create new courier
- `updateCourier(req, res, next)` - Update courier information
- `updateCourierLocation(req, res, next)` - Update courier GPS location
- `updateCourierAvailability(req, res, next)` - Toggle courier availability

### 6. products.controller.js
Product management controller.

**Methods:**
- `getAllProducts(req, res, next)` - Get all products with filters (vendorId, category, search) and pagination
- `getProductById(req, res, next)` - Get product by ID
- `createProduct(req, res, next)` - Create new product
- `updateProduct(req, res, next)` - Update product information
- `deleteProduct(req, res, next)` - Delete product

### 7. stats.controller.js
Statistics and analytics controller.

**Methods:**
- `getDashboardStats(req, res, next)` - Get dashboard statistics (today, week, month)
- `getVendorStats(req, res, next)` - Get vendor-specific statistics
- `getCourierStats(req, res, next)` - Get courier-specific statistics
- `getRevenueStats(req, res, next)` - Get revenue statistics

## Usage

Import controllers:
```javascript
const {
  authController,
  usersController,
  ordersController,
  vendorsController,
  couriersController,
  productsController,
  statsController
} = require('./api/controllers');
```

Use in routes:
```javascript
router.post('/auth/login', authController.login);
router.get('/users', usersController.getAllUsers);
router.get('/orders/:id', ordersController.getOrderById);
```

## Response Format

All controllers return consistent JSON responses:

**Success:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

**Error (handled by error middleware):**
```json
{
  "error": {
    "name": "ValidationError",
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "timestamp": "2024-01-29T12:00:00.000Z"
  }
}
```
