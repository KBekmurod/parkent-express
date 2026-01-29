# Socket.io Integration Guide for Parkent Express

## Quick Start

### 1. Server Integration

Add Socket.io to your Express server:

```javascript
// server.js or app.js
const express = require('express');
const http = require('http');
const socketServer = require('./socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketServer.initialize(server);

// Your Express routes here...

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io initialized with ${socketServer.getStats().total} connections`);
});
```

### 2. Environment Variables

Add to `.env`:

```env
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development
```

### 3. Order Controller Integration

```javascript
// api/controllers/orders.controller.js
const socketServer = require('../../socket');
const orderUpdatesHandler = require('../../socket/handlers/orderUpdates');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    
    // Emit new order event
    const io = socketServer.getIO();
    orderUpdatesHandler.emitNewOrder(io, order);
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate('customer vendor courier');
    
    // Emit order update
    const io = socketServer.getIO();
    orderUpdatesHandler.emitOrderUpdated(io, order);
    orderUpdatesHandler.emitStatusChanged(io, orderId, status, {
      previousStatus: order.status,
      updatedBy: req.user.userId
    });
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: req.user.userId,
        cancelledAt: new Date()
      },
      { new: true }
    ).populate('customer vendor courier');
    
    // Emit cancellation
    const io = socketServer.getIO();
    orderUpdatesHandler.emitOrderCancelled(io, order);
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Assign courier
exports.assignCourier = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { courierId } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        courier: courierId,
        status: 'assigned'
      },
      { new: true }
    ).populate('courier');
    
    // Emit courier assignment
    const io = socketServer.getIO();
    orderUpdatesHandler.emitCourierAssigned(io, orderId, order.courier);
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
```

### 4. Courier Controller Integration

```javascript
// api/controllers/couriers.controller.js
const socketServer = require('../../socket');
const courierLocationHandler = require('../../socket/handlers/courierLocation');

// Update courier location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;
    const courierId = req.user.userId;
    
    // Save to database if needed
    await Courier.findByIdAndUpdate(courierId, {
      lastLocation: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      lastLocationUpdate: new Date()
    });
    
    // Emit location update
    const io = socketServer.getIO();
    courierLocationHandler.emitCourierLocationUpdate(io, courierId, {
      orderId,
      latitude,
      longitude,
      accuracy: req.body.accuracy,
      speed: req.body.speed,
      heading: req.body.heading
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update availability
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const courierId = req.user.userId;
    
    await Courier.findByIdAndUpdate(courierId, {
      isAvailable,
      status: isAvailable ? 'online' : 'offline'
    });
    
    // Emit availability change
    const io = socketServer.getIO();
    courierLocationHandler.emitCourierAvailabilityChange(io, courierId, isAvailable);
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
```

### 5. Notification Service

```javascript
// services/notification.service.js
const socketServer = require('../socket');
const notificationsHandler = require('../socket/handlers/notifications');

class NotificationService {
  // Send notification to user
  static async sendToUser(userId, notification) {
    const io = socketServer.getIO();
    return notificationsHandler.sendNotificationToUser(io, userId, notification);
  }
  
  // Send notification to role
  static async sendToRole(role, notification) {
    const io = socketServer.getIO();
    return notificationsHandler.sendNotificationToRole(io, role, notification);
  }
  
  // Send order notification
  static async sendOrderNotification(userId, orderId, type, data = {}) {
    const io = socketServer.getIO();
    return notificationsHandler.sendOrderNotification(io, userId, orderId, type, data);
  }
  
  // Send system notification
  static async sendSystemNotification(notification) {
    const io = socketServer.getIO();
    return notificationsHandler.broadcastSystemNotification(io, notification);
  }
}

module.exports = NotificationService;
```

### 6. Client-Side Implementation (React/React Native)

```javascript
// hooks/useSocket.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (token, userId, role) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL, {
      auth: {
        token,
        userId,
        role
      }
    });

    socketInstance.on('connected', (data) => {
      console.log('Connected to Socket.io:', data);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.io');
      setConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, userId, role]);

  return { socket, connected };
};
```

```javascript
// components/OrderTracking.jsx
import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const OrderTracking = ({ orderId, token, userId, role }) => {
  const { socket, connected } = useSocket(token, userId, role);
  const [orderStatus, setOrderStatus] = useState(null);
  const [courierLocation, setCourierLocation] = useState(null);

  useEffect(() => {
    if (!socket || !connected) return;

    // Join order room
    socket.emit('order:join', orderId);

    // Listen for order updates
    socket.on('order:update', (data) => {
      console.log('Order updated:', data);
      setOrderStatus(data);
    });

    // Listen for status changes
    socket.on('order:status:changed', (data) => {
      console.log('Status changed:', data);
      setOrderStatus(prev => ({ ...prev, status: data.status }));
    });

    // Listen for courier location
    socket.on('location:update', (data) => {
      console.log('Courier location:', data);
      setCourierLocation(data);
    });

    return () => {
      socket.emit('order:leave', orderId);
      socket.off('order:update');
      socket.off('order:status:changed');
      socket.off('location:update');
    };
  }, [socket, connected, orderId]);

  return (
    <div>
      <h2>Order Tracking</h2>
      {orderStatus && <p>Status: {orderStatus.status}</p>}
      {courierLocation && (
        <div>
          <p>Courier Location:</p>
          <p>Lat: {courierLocation.latitude}, Lng: {courierLocation.longitude}</p>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
```

```javascript
// components/CourierLocationSender.jsx (React Native)
import React, { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import Geolocation from '@react-native-community/geolocation';

const CourierLocationSender = ({ orderId, token, userId, role }) => {
  const { socket, connected } = useSocket(token, userId, role);

  useEffect(() => {
    if (!socket || !connected || !orderId) return;

    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        
        // Send location to server
        socket.emit('location:update', {
          latitude,
          longitude,
          orderId,
          accuracy,
          speed,
          heading
        });
      },
      (error) => console.error('Location error:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
      }
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, [socket, connected, orderId]);

  return null; // This is a background component
};

export default CourierLocationSender;
```

### 7. Testing

```bash
# Run the test suite
cd backend/socket
node test.js

# Test with a real server
node -e "
const socketServer = require('./index');
const http = require('http');

const server = http.createServer();
socketServer.initialize(server);

server.listen(3000, () => {
  console.log('Socket.io test server running on port 3000');
  console.log('Connect with: socket.io-client');
});
"
```

### 8. Monitoring

```javascript
// Add monitoring endpoint
app.get('/socket-stats', (req, res) => {
  const stats = socketServer.getStats();
  res.json({
    totalConnections: stats.total,
    byRole: stats.roles,
    timestamp: stats.timestamp
  });
});
```

## Best Practices

1. **Always emit events after database operations succeed**
2. **Include all relevant data in payloads**
3. **Use appropriate rooms to limit event broadcast scope**
4. **Handle socket disconnections gracefully**
5. **Validate coordinates before emitting location updates**
6. **Use Winston logger for debugging**
7. **Implement reconnection logic on client-side**
8. **Monitor connection count and performance**

## Troubleshooting

### Socket not connecting
- Check JWT_SECRET is configured
- Verify CORS_ORIGIN matches client origin
- Ensure authentication credentials are correct

### Events not received
- Verify user joined correct room
- Check socket is connected
- Look at server logs for errors

### Location updates failing
- Validate coordinates are valid numbers
- Check latitude (-90 to 90) and longitude (-180 to 180) ranges
- Ensure courier has joined order room

## Production Checklist

- [ ] Set proper CORS_ORIGIN
- [ ] Configure JWT_SECRET securely
- [ ] Set LOG_LEVEL to 'info' or 'warn'
- [ ] Enable HTTPS for Socket.io
- [ ] Set up connection monitoring
- [ ] Configure rate limiting
- [ ] Test with expected load
- [ ] Set up logging aggregation
- [ ] Configure alerts for disconnections
- [ ] Test failover scenarios

## Support

For issues or questions:
- Check README.md for detailed API documentation
- Review test.js for usage examples
- Check Winston logs for error details
