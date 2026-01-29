# Socket.io Implementation for Parkent Express

This directory contains the complete Socket.io real-time communication implementation for the Parkent Express delivery system.

## Directory Structure

```
socket/
├── index.js                          # Main Socket.io server setup
├── rooms.js                          # Room management utilities
└── handlers/
    ├── orderUpdates.js              # Order status change handlers
    ├── courierLocation.js           # Live courier tracking handlers
    └── notifications.js             # Real-time notification handlers
```

## Files Overview

### 1. index.js - Socket.io Server Setup

Main entry point for Socket.io server initialization and connection management.

**Features:**
- Socket.io server initialization with CORS configuration
- JWT token authentication middleware
- Connection/disconnection event handling
- Room management integration
- User tracking and statistics
- Error handling and logging

**Key Methods:**
- `initialize(server)` - Initialize Socket.io with HTTP server
- `setupMiddleware()` - Setup authentication middleware
- `setupEventHandlers()` - Setup connection event handlers
- `getIO()` - Get Socket.io instance
- `isUserConnected(userId)` - Check if user is connected
- `getStats()` - Get connection statistics

**Events Handled:**
- `connection` - New socket connection
- `disconnect` - Socket disconnection
- `order:join` - Join order room
- `order:leave` - Leave order room
- `location:update` - Location update from courier
- `courier:availability` - Courier availability status change
- `room:members` - Get room members (admin only)

### 2. rooms.js - Room Management

Utilities for managing Socket.io rooms and user groupings.

**Functions:**
- `joinAdminRoom(socket)` - Join 'admin' room for admins/vendors
- `joinOrderRoom(socket, orderId)` - Join specific order room
- `leaveOrderRoom(socket, orderId)` - Leave specific order room
- `joinCourierTrackingRoom(socket)` - Join courier tracking room
- `joinVendorRoom(socket, vendorId)` - Join vendor-specific room
- `leaveVendorRoom(socket, vendorId)` - Leave vendor-specific room
- `getRoomMembers(io, roomName)` - Get all members in a room
- `getRoomMemberCount(io, roomName)` - Get member count
- `roomExists(io, roomName)` - Check if room has members
- `clearRoom(io, roomName)` - Remove all members from room

**Room Naming Convention:**
- `admin` - Admin and vendor room
- `role:{role}` - Role-based rooms (admin, vendor, courier, customer)
- `user:{userId}` - User-specific rooms
- `order:{orderId}` - Order-specific rooms
- `vendor:{vendorId}` - Vendor-specific rooms
- `courier-tracking` - Courier tracking room

### 3. handlers/orderUpdates.js - Order Status Changes

Emit order-related events to relevant parties.

**Functions:**
- `emitNewOrder(io, orderData)` - Notify about new order creation
  - Emits to: admin room, vendor room, role:vendor, role:admin
- `emitOrderUpdated(io, orderData)` - Notify about order updates
  - Emits to: order room, admin room, customer, vendor, courier
- `emitOrderCancelled(io, orderData)` - Notify about order cancellation
  - Emits to: order room, admin room, customer, vendor, courier
- `emitStatusChanged(io, orderId, status, additionalData)` - Notify about status change
  - Emits to: order room, admin room
- `emitCourierAssigned(io, orderId, courierData)` - Notify about courier assignment
  - Emits to: order room, courier, admin room

**Events Emitted:**
- `order:new` - New order created
- `order:update` - Order updated
- `order:cancelled` - Order cancelled
- `order:status:changed` - Order status changed
- `order:assigned` - Courier assigned to order

### 4. handlers/courierLocation.js - Live Courier Tracking

Manage real-time courier location updates and availability.

**Functions:**
- `emitCourierLocationUpdate(io, courierId, location)` - Send location update
  - Emits to: courier-tracking room, order room (if orderId provided), admin room
  - Validates coordinates (-90 to 90 for latitude, -180 to 180 for longitude)
- `emitCourierAvailabilityChange(io, courierId, isAvailable)` - Update availability status
  - Emits to: courier-tracking room, admin, vendor roles
- `emitCourierBusy(io, courierId, orderId)` - Mark courier as busy
  - Emits to: courier-tracking room, admin, vendor roles
- `emitCourierAvailable(io, courierId, orderId)` - Mark courier as available
  - Emits to: courier-tracking room, admin, vendor roles
- `emitCourierRouteUpdate(io, courierId, orderId, routeData)` - Send route/ETA update
  - Emits to: order room, admin room
- `emitCourierArrivedAtPickup(io, courierId, orderId)` - Notify arrival at pickup
  - Emits to: order room, admin room
- `emitCourierArrivedAtDelivery(io, courierId, orderId)` - Notify arrival at delivery
  - Emits to: order room, admin room

**Events Emitted:**
- `location:update` - Courier location update
- `courier:availability:changed` - Courier availability changed
- `courier:online` - Courier went online
- `courier:offline` - Courier went offline
- `courier:busy` - Courier is busy with order
- `courier:available` - Courier is available
- `courier:route:update` - Route/ETA update
- `courier:arrived:pickup` - Arrived at pickup location
- `courier:arrived:delivery` - Arrived at delivery location

### 5. handlers/notifications.js - Real-time Notifications

Send real-time notifications to users, roles, and system-wide.

**Functions:**
- `sendNotificationToUser(io, userId, notification)` - Send to specific user
- `sendNotificationToRole(io, role, notification)` - Send to all users with role
- `broadcastSystemNotification(io, notification)` - Broadcast to all users
- `sendOrderNotification(io, userId, orderId, type, data)` - Send order-specific notification
- `sendPaymentNotification(io, userId, orderId, paymentData)` - Send payment notification
- `sendNotificationToMultipleUsers(io, userIds, notification)` - Send to multiple users

**Notification Types Supported:**
- `order_created` - Order created
- `order_accepted` - Order accepted
- `order_preparing` - Order being prepared
- `order_ready` - Order ready for pickup
- `order_assigned` - Courier assigned
- `order_picked_up` - Order picked up
- `order_delivering` - Order on the way
- `order_completed` - Order delivered
- `order_cancelled` - Order cancelled
- `courier_assigned` - Courier assigned
- `payment_received` - Payment received

**Events Emitted:**
- `notification` - Regular notification
- `notification:system` - System-wide notification

## Usage Examples

### Initialize Socket.io Server

```javascript
const socketServer = require('./socket');
const http = require('http');

const server = http.createServer(app);
const io = socketServer.initialize(server);

server.listen(3000, () => {
  console.log('Server with Socket.io running on port 3000');
});
```

### Send Order Update

```javascript
const socketServer = require('./socket');
const orderUpdatesHandler = require('./socket/handlers/orderUpdates');

// Get Socket.io instance
const io = socketServer.getIO();

// Emit new order
orderUpdatesHandler.emitNewOrder(io, {
  _id: 'order123',
  orderNumber: 'PE12345678',
  customerId: 'user123',
  vendorId: 'vendor456',
  items: [...],
  totalAmount: 50000,
  status: 'pending'
});

// Emit status change
orderUpdatesHandler.emitStatusChanged(io, 'order123', 'accepted', {
  previousStatus: 'pending',
  message: 'Order accepted by vendor'
});
```

### Track Courier Location

```javascript
const courierLocationHandler = require('./socket/handlers/courierLocation');

// Update courier location
courierLocationHandler.emitCourierLocationUpdate(io, 'courier123', {
  orderId: 'order123',
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  speed: 5.5,
  heading: 180
});

// Update courier availability
courierLocationHandler.emitCourierAvailabilityChange(io, 'courier123', true);
```

### Send Notifications

```javascript
const notificationsHandler = require('./socket/handlers/notifications');

// Send notification to specific user
notificationsHandler.sendNotificationToUser(io, 'user123', {
  type: 'order_update',
  title: 'Order Update',
  message: 'Your order is on the way!',
  priority: 'high'
});

// Send notification to all couriers
notificationsHandler.sendNotificationToRole(io, 'courier', {
  type: 'system',
  title: 'New Orders Available',
  message: 'Check the dashboard for new delivery opportunities'
});

// Broadcast system notification
notificationsHandler.broadcastSystemNotification(io, {
  title: 'System Maintenance',
  message: 'Scheduled maintenance in 1 hour',
  priority: 'high'
});
```

### Room Management

```javascript
const rooms = require('./socket/rooms');

// Join order room
socket.on('order:track', (orderId) => {
  rooms.joinOrderRoom(socket, orderId);
});

// Get room members (admin only)
const members = await rooms.getRoomMembers(io, 'order:123');
console.log('Room members:', members);
```

## Client-Side Integration

### Connect to Socket.io Server

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token',
    userId: 'user123',
    role: 'customer'
  }
});

// Connection confirmed
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Listen for order updates
socket.on('order:update', (data) => {
  console.log('Order updated:', data);
});

// Listen for location updates
socket.on('location:update', (data) => {
  console.log('Courier location:', data);
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Join order room
socket.emit('order:join', 'order123');

// Send location update (for couriers)
socket.emit('location:update', {
  latitude: 40.7128,
  longitude: -74.0060,
  orderId: 'order123'
});
```

## Authentication

The Socket.io server supports two authentication methods:

1. **JWT Token Authentication** (Recommended)
   ```javascript
   auth: {
     token: 'your-jwt-token'
   }
   ```

2. **Credentials Authentication**
   ```javascript
   auth: {
     userId: 'user123',
     role: 'customer'
   }
   ```

JWT tokens are verified using the `JWT_SECRET` environment variable.

## Error Handling

All handlers include comprehensive error handling:
- Input validation
- Coordinate validation for location updates
- Role-based access control
- Detailed error logging
- Error events emitted to clients

```javascript
// Client-side error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## Logging

All Socket.io operations are logged using Winston logger:
- Connection/disconnection events
- Room join/leave events
- Event emissions
- Errors and exceptions

Log levels:
- `info` - Important events
- `debug` - Detailed operation logs
- `error` - Errors and exceptions
- `warn` - Warnings

## Environment Variables

Required environment variables:
- `JWT_SECRET` - Secret key for JWT verification
- `CORS_ORIGIN` - Allowed CORS origin (default: '*')
- `LOG_LEVEL` - Logging level (default: 'info')
- `NODE_ENV` - Environment (development/production)

## Performance Considerations

- Socket.io uses WebSocket transport with polling fallback
- Connection timeout: 60 seconds
- Ping interval: 25 seconds
- Maximum buffer size: 1MB
- Room-based broadcasting for efficient message delivery
- User tracking with Map for O(1) lookups

## Security

- JWT token verification for authentication
- Role-based access control
- Input validation for all events
- Coordinate validation for location data
- CORS configuration
- Error message sanitization

## Testing

All handlers can be tested independently:

```javascript
const orderUpdatesHandler = require('./socket/handlers/orderUpdates');

// Mock io object
const mockIo = {
  to: (room) => ({
    emit: (event, data) => {
      console.log(`Emit to ${room}:`, event, data);
    }
  })
};

// Test emission
orderUpdatesHandler.emitNewOrder(mockIo, orderData);
```

## Troubleshooting

**Connection Issues:**
- Verify JWT_SECRET is configured
- Check CORS_ORIGIN matches client origin
- Ensure valid authentication credentials

**Location Updates Not Working:**
- Verify coordinates are valid numbers
- Check latitude is between -90 and 90
- Check longitude is between -180 and 180
- Ensure courier has joined order room

**Notifications Not Received:**
- Verify user is connected (use `isUserConnected`)
- Check user has joined correct room
- Verify notification has required fields (type, message/title)

## API Reference

See individual file documentation for complete API reference:
- [index.js](./index.js) - Main server API
- [rooms.js](./rooms.js) - Room management API
- [handlers/orderUpdates.js](./handlers/orderUpdates.js) - Order updates API
- [handlers/courierLocation.js](./handlers/courierLocation.js) - Courier tracking API
- [handlers/notifications.js](./handlers/notifications.js) - Notifications API

## Contributing

When adding new features:
1. Add proper error handling
2. Include detailed logging
3. Validate all inputs
4. Add JSDoc comments
5. Follow existing naming conventions
6. Update this README

## License

MIT
