const logger = require('../../utils/logger');
const { SOCKET_EVENTS } = require('../../config/constants');

/**
 * Courier location tracking event handlers
 * Manages real-time courier location updates and availability status
 */

/**
 * Emit courier location update to tracking room and specific order
 * @param {Object} io - Socket.io server instance
 * @param {String} courierId - Courier ID
 * @param {Object} location - Location data
 */
function emitCourierLocationUpdate(io, courierId, location) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!courierId) {
      throw new Error('Courier ID is required');
    }

    if (!location) {
      throw new Error('Location data is required');
    }

    if (!location.latitude || !location.longitude) {
      throw new Error('Invalid location: latitude and longitude are required');
    }

    // Validate coordinates
    if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      throw new Error('Invalid location: coordinates must be numbers');
    }

    if (location.latitude < -90 || location.latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }

    if (location.longitude < -180 || location.longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    const payload = {
      courierId,
      latitude: location.latitude,
      longitude: location.longitude,
      orderId: location.orderId || null,
      accuracy: location.accuracy || null,
      speed: location.speed || null,
      heading: location.heading || null,
      altitude: location.altitude || null,
      timestamp: location.timestamp || new Date()
    };

    // Emit to courier tracking room (for admins/vendors)
    io.to('courier-tracking').emit(SOCKET_EVENTS.LOCATION_UPDATE, payload);

    // If orderId is provided, emit to that specific order room
    if (payload.orderId) {
      io.to(`order:${payload.orderId}`).emit(SOCKET_EVENTS.LOCATION_UPDATE, payload);
      
      logger.debug('Courier location update emitted to order', {
        courierId,
        orderId: payload.orderId,
        latitude: payload.latitude,
        longitude: payload.longitude
      });
    }

    // Emit to admin room
    io.to('admin').emit(SOCKET_EVENTS.LOCATION_UPDATE, payload);

    logger.debug('Courier location update emitted', {
      courierId,
      orderId: payload.orderId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy
    });

    return true;
  } catch (error) {
    logger.error('Error emitting courier location update', {
      error: error.message,
      stack: error.stack,
      courierId,
      location
    });
    return false;
  }
}

/**
 * Emit courier availability status change
 * @param {Object} io - Socket.io server instance
 * @param {String} courierId - Courier ID
 * @param {Boolean} isAvailable - Availability status
 */
function emitCourierAvailabilityChange(io, courierId, isAvailable) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!courierId) {
      throw new Error('Courier ID is required');
    }

    if (typeof isAvailable !== 'boolean') {
      throw new Error('Invalid availability status: must be boolean');
    }

    const payload = {
      courierId,
      isAvailable,
      status: isAvailable ? 'online' : 'offline',
      timestamp: new Date()
    };

    // Emit to courier tracking room
    io.to('courier-tracking').emit('courier:availability:changed', payload);

    // Emit to admin and vendor rooms
    io.to('admin').emit('courier:availability:changed', payload);
    io.to('role:admin').emit('courier:availability:changed', payload);
    io.to('role:vendor').emit('courier:availability:changed', payload);

    // Emit appropriate online/offline event
    const eventName = isAvailable ? SOCKET_EVENTS.COURIER_ONLINE : SOCKET_EVENTS.COURIER_OFFLINE;
    io.to('role:vendor').emit(eventName, payload);
    io.to('role:admin').emit(eventName, payload);

    logger.info('Courier availability change emitted', {
      courierId,
      isAvailable,
      status: payload.status
    });

    return true;
  } catch (error) {
    logger.error('Error emitting courier availability change', {
      error: error.message,
      stack: error.stack,
      courierId,
      isAvailable
    });
    return false;
  }
}

/**
 * Emit courier busy status (when courier picks up an order)
 * @param {Object} io - Socket.io server instance
 * @param {String} courierId - Courier ID
 * @param {String} orderId - Order ID the courier is working on
 */
function emitCourierBusy(io, courierId, orderId) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!courierId) {
      throw new Error('Courier ID is required');
    }

    const payload = {
      courierId,
      orderId: orderId || null,
      status: 'busy',
      isAvailable: false,
      timestamp: new Date()
    };

    // Emit to courier tracking room
    io.to('courier-tracking').emit('courier:busy', payload);

    // Emit to admin and vendor rooms
    io.to('admin').emit('courier:busy', payload);
    io.to('role:admin').emit('courier:busy', payload);
    io.to('role:vendor').emit('courier:busy', payload);

    logger.info('Courier busy status emitted', {
      courierId,
      orderId,
      status: payload.status
    });

    return true;
  } catch (error) {
    logger.error('Error emitting courier busy status', {
      error: error.message,
      stack: error.stack,
      courierId,
      orderId
    });
    return false;
  }
}

/**
 * Emit courier completed delivery (back to available)
 * @param {Object} io - Socket.io server instance
 * @param {String} courierId - Courier ID
 * @param {String} orderId - Completed order ID
 */
function emitCourierAvailable(io, courierId, orderId) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!courierId) {
      throw new Error('Courier ID is required');
    }

    const payload = {
      courierId,
      orderId: orderId || null,
      status: 'online',
      isAvailable: true,
      timestamp: new Date()
    };

    // Emit to courier tracking room
    io.to('courier-tracking').emit('courier:available', payload);

    // Emit to admin and vendor rooms
    io.to('admin').emit('courier:available', payload);
    io.to('role:admin').emit('courier:available', payload);
    io.to('role:vendor').emit('courier:available', payload);

    logger.info('Courier available status emitted', {
      courierId,
      orderId,
      status: payload.status
    });

    return true;
  } catch (error) {
    logger.error('Error emitting courier available status', {
      error: error.message,
      stack: error.stack,
      courierId,
      orderId
    });
    return false;
  }
}

/**
 * Emit courier route/ETA update
 * @param {Object} io - Socket.io server instance
 * @param {String} courierId - Courier ID
 * @param {String} orderId - Order ID
 * @param {Object} routeData - Route and ETA information
 */
function emitCourierRouteUpdate(io, courierId, orderId, routeData) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!courierId) {
      throw new Error('Courier ID is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!routeData) {
      throw new Error('Route data is required');
    }

    const payload = {
      courierId,
      orderId,
      estimatedTimeArrival: routeData.eta || routeData.estimatedTimeArrival,
      distance: routeData.distance || null,
      duration: routeData.duration || null,
      currentLocation: routeData.currentLocation || null,
      destinationLocation: routeData.destinationLocation || null,
      timestamp: new Date()
    };

    // Emit to specific order room
    io.to(`order:${orderId}`).emit('courier:route:update', payload);

    // Emit to admin room
    io.to('admin').emit('courier:route:update', payload);

    logger.debug('Courier route update emitted', {
      courierId,
      orderId,
      eta: payload.estimatedTimeArrival,
      distance: payload.distance
    });

    return true;
  } catch (error) {
    logger.error('Error emitting courier route update', {
      error: error.message,
      stack: error.stack,
      courierId,
      orderId,
      routeData
    });
    return false;
  }
}

/**
 * Emit courier arrived at pickup location
 * @param {Object} io - Socket.io server instance
 * @param {String} courierId - Courier ID
 * @param {String} orderId - Order ID
 */
function emitCourierArrivedAtPickup(io, courierId, orderId) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!courierId) {
      throw new Error('Courier ID is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const payload = {
      courierId,
      orderId,
      message: 'Courier has arrived at pickup location',
      timestamp: new Date()
    };

    // Emit to order room
    io.to(`order:${orderId}`).emit('courier:arrived:pickup', payload);

    // Emit to admin room
    io.to('admin').emit('courier:arrived:pickup', payload);

    logger.info('Courier arrived at pickup notification emitted', {
      courierId,
      orderId
    });

    return true;
  } catch (error) {
    logger.error('Error emitting courier arrived at pickup', {
      error: error.message,
      stack: error.stack,
      courierId,
      orderId
    });
    return false;
  }
}

/**
 * Emit courier arrived at delivery location
 * @param {Object} io - Socket.io server instance
 * @param {String} courierId - Courier ID
 * @param {String} orderId - Order ID
 */
function emitCourierArrivedAtDelivery(io, courierId, orderId) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!courierId) {
      throw new Error('Courier ID is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const payload = {
      courierId,
      orderId,
      message: 'Courier has arrived at delivery location',
      timestamp: new Date()
    };

    // Emit to order room
    io.to(`order:${orderId}`).emit('courier:arrived:delivery', payload);

    // Emit to admin room
    io.to('admin').emit('courier:arrived:delivery', payload);

    logger.info('Courier arrived at delivery notification emitted', {
      courierId,
      orderId
    });

    return true;
  } catch (error) {
    logger.error('Error emitting courier arrived at delivery', {
      error: error.message,
      stack: error.stack,
      courierId,
      orderId
    });
    return false;
  }
}

module.exports = {
  emitCourierLocationUpdate,
  emitCourierAvailabilityChange,
  emitCourierBusy,
  emitCourierAvailable,
  emitCourierRouteUpdate,
  emitCourierArrivedAtPickup,
  emitCourierArrivedAtDelivery
};
