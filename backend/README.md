# Parkent Express - Backend

Complete backend foundation for the Parkent Express delivery system - a Telegram bot-based delivery platform for Parkent, Uzbekistan.

## 🏗️ Architecture

The backend is built with Node.js/Express and follows a clean, modular architecture:

```
backend/
├── api/                    # API layer
│   ├── controllers/        # Request handlers
│   ├── routes/            # Route definitions
│   └── validators/        # Request validation
├── config/                # Configuration files
├── middleware/            # Express middleware
├── models/               # Mongoose models
├── services/             # Business logic
├── socket/               # Socket.io implementation
└── utils/                # Utilities and helpers
```

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Real-time Communication**: Socket.io for live order tracking and updates
- **Telegram Bot Integration**: Native Telegram bot for user interactions
- **Geolocation Services**: Location-based vendor/courier matching
- **Order Management**: Complete order lifecycle management
- **Multi-role Support**: Customer, Vendor, Courier, and Admin roles
- **Session Management**: Bot conversation state management
- **Notification System**: Multi-channel notifications (Telegram + Socket.io)

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io
- **Bot**: node-telegram-bot-api
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, bcryptjs

## 🔧 Installation

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set required environment variables**:
```env
# Required
MONGODB_URI=mongodb://localhost:27017/parkent-express
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
JWT_SECRET=your_jwt_secret_key

# Optional
PORT=3000
NODE_ENV=development
```

4. **Start the server**:
```bash
# Development
npm run dev

# Production
npm start
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login/telegram` - Login via Telegram
- `POST /api/auth/login/phone` - Login via phone/password
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/location` - Update user location
- `GET /api/users/stats` - Get user statistics

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - List orders (filtered by role)
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/confirm` - Confirm order (vendor)
- `POST /api/orders/:id/reject` - Reject order (vendor)
- `POST /api/orders/:id/assign` - Assign courier (admin)
- `POST /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/:id/rate` - Rate order (customer)

### Vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors` - List vendors
- `GET /api/vendors/nearby` - Find nearby vendors
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor
- `PATCH /api/vendors/:id/status` - Toggle vendor status
- `POST /api/vendors/:id/verify` - Verify vendor (admin)

### Products
- `POST /api/products` - Create product
- `GET /api/products` - List products
- `GET /api/products/search` - Search products
- `GET /api/products/vendor/:vendorId` - Get vendor products
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `PATCH /api/products/:id/availability` - Toggle availability
- `PATCH /api/products/:id/stock` - Update stock

### Couriers
- `POST /api/couriers/register` - Register as courier
- `GET /api/couriers/profile` - Get courier profile
- `POST /api/couriers/online` - Go online
- `POST /api/couriers/offline` - Go offline
- `POST /api/couriers/location` - Update location
- `GET /api/couriers/stats` - Get courier statistics
- `POST /api/couriers/:id/approve` - Approve courier (admin)

## 🔌 Socket.io Events

### Client → Server
- `join:room` - Join a room
- `order:accept` - Accept order (vendor)
- `order:reject` - Reject order (vendor)
- `order:cancel` - Cancel order
- `courier:online` - Go online
- `courier:offline` - Go offline
- `courier:location_update` - Update location
- `courier:accept_order` - Accept delivery
- `courier:arrived` - Notify arrival

### Server → Client
- `order:created` - New order created
- `order:updated` - Order updated
- `order:status_changed` - Order status changed
- `courier:location_updated` - Courier location updated
- `courier:status_changed` - Courier status changed
- `new:order` - New order available
- `notification` - General notification

## 📊 Models

### User
- Telegram-based authentication
- Phone number verification
- Role-based permissions (customer, vendor, courier, admin)
- Location tracking
- Notification preferences

### Order
- Complete order lifecycle management
- Status workflow (pending → delivered)
- Timeline tracking
- Rating system
- Automatic order number generation

### Vendor
- Business information
- Working hours management
- Location-based search
- Rating and statistics
- Product catalog

### Product
- Inventory management
- Stock tracking
- Image gallery
- Options and variants
- Search and filtering

### Courier
- Vehicle information
- Document verification
- Real-time location tracking
- Earnings management
- Performance statistics

### Session
- Bot conversation state
- Automatic expiration
- Step-by-step tracking
- Data persistence

## 🛡️ Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **JWT**: Secure token-based authentication
- **Input Validation**: Request validation with express-validator
- **Password Hashing**: bcryptjs for secure password storage
- **Error Handling**: Comprehensive error handling middleware

## 📝 Logging

Winston-based logging with:
- Console output (colorized for development)
- File logging (error.log, combined.log)
- Request logging with Morgan
- Context-based loggers
- Log rotation

## 🔄 Status Workflow

### Order Status Flow
```
pending → confirmed → preparing → ready → assigned → picked_up → in_transit → delivered
         ↓                                ↓                              ↓
     rejected                         cancelled                     cancelled
```

### Courier Status Flow
```
pending → approved → active → [online/offline]
         ↓
     rejected → suspended
```

## 🚦 Health Check

Access `/health` endpoint for system status:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "services": {
    "database": { "status": "connected" },
    "bot": { "status": "running" },
    "socket": { "status": "running", "connectedClients": 42 }
  },
  "memory": { "used": 128, "total": 256, "unit": "MB" }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

## 🐛 Error Handling

Centralized error handling with:
- MongoDB validation errors
- JWT authentication errors
- Duplicate key errors
- Cast errors
- Custom error codes

## 🌍 Environment Variables

See `.env.example` for all available configuration options:
- Server configuration
- Database connection
- JWT secrets
- Telegram bot token
- Socket.io settings
- Location services
- Payment settings
- Rate limiting

## 📄 License

MIT

## 👥 Support

For support, please contact the development team or open an issue in the repository.
