const logger = require('../utils/logger');

/**
 * Room management utilities for Socket.io
 */

/**
 * Join the admin room for administrators and vendors
 * @param {Object} socket - Socket instance
 */
function joinAdminRoom(socket) {
  try {
    if (!socket) {
      throw new Error('Socket instance is required');
    }

    const roomName = 'admin';
    socket.join(roomName);

    logger.debug('User joined admin room', {
      userId: socket.userId,
      role: socket.role,
      socketId: socket.id,
      roomName
    });

    return true;
  } catch (error) {
    logger.error('Error joining admin room', {
      error: error.message,
      userId: socket?.userId,
      socketId: socket?.id
    });
    throw error;
  }
}

/**
 * Join specific order room
 * @param {Object} socket - Socket instance
 * @param {String} orderId - Order ID
 */
function joinOrderRoom(socket, orderId) {
  try {
    if (!socket) {
      throw new Error('Socket instance is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const roomName = `order:${orderId}`;
    socket.join(roomName);

    logger.debug('User joined order room', {
      userId: socket.userId,
      role: socket.role,
      socketId: socket.id,
      orderId,
      roomName
    });

    return true;
  } catch (error) {
    logger.error('Error joining order room', {
      error: error.message,
      userId: socket?.userId,
      socketId: socket?.id,
      orderId
    });
    throw error;
  }
}

/**
 * Leave specific order room
 * @param {Object} socket - Socket instance
 * @param {String} orderId - Order ID
 */
function leaveOrderRoom(socket, orderId) {
  try {
    if (!socket) {
      throw new Error('Socket instance is required');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const roomName = `order:${orderId}`;
    socket.leave(roomName);

    logger.debug('User left order room', {
      userId: socket.userId,
      role: socket.role,
      socketId: socket.id,
      orderId,
      roomName
    });

    return true;
  } catch (error) {
    logger.error('Error leaving order room', {
      error: error.message,
      userId: socket?.userId,
      socketId: socket?.id,
      orderId
    });
    throw error;
  }
}

/**
 * Join courier tracking room for real-time location updates
 * @param {Object} socket - Socket instance
 */
function joinCourierTrackingRoom(socket) {
  try {
    if (!socket) {
      throw new Error('Socket instance is required');
    }

    const roomName = 'courier-tracking';
    socket.join(roomName);

    logger.debug('Courier joined tracking room', {
      userId: socket.userId,
      courierId: socket.userId,
      role: socket.role,
      socketId: socket.id,
      roomName
    });

    return true;
  } catch (error) {
    logger.error('Error joining courier tracking room', {
      error: error.message,
      userId: socket?.userId,
      socketId: socket?.id
    });
    throw error;
  }
}

/**
 * Get all members of a specific room
 * @param {Object} io - Socket.io server instance
 * @param {String} roomName - Room name
 * @returns {Promise<Array>} Array of socket IDs in the room
 */
async function getRoomMembers(io, roomName) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!roomName) {
      throw new Error('Room name is required');
    }

    // Get all sockets in the room
    const sockets = await io.in(roomName).fetchSockets();
    
    const members = sockets.map(socket => ({
      socketId: socket.id,
      userId: socket.userId,
      role: socket.role,
      username: socket.username,
      rooms: Array.from(socket.rooms)
    }));

    logger.debug('Retrieved room members', {
      roomName,
      count: members.length
    });

    return members;
  } catch (error) {
    logger.error('Error getting room members', {
      error: error.message,
      roomName
    });
    throw error;
  }
}

/**
 * Get number of members in a room
 * @param {Object} io - Socket.io server instance
 * @param {String} roomName - Room name
 * @returns {Promise<Number>} Number of members in the room
 */
async function getRoomMemberCount(io, roomName) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!roomName) {
      throw new Error('Room name is required');
    }

    const sockets = await io.in(roomName).fetchSockets();
    return sockets.length;
  } catch (error) {
    logger.error('Error getting room member count', {
      error: error.message,
      roomName
    });
    return 0;
  }
}

/**
 * Check if a room exists and has members
 * @param {Object} io - Socket.io server instance
 * @param {String} roomName - Room name
 * @returns {Promise<Boolean>} True if room has members
 */
async function roomExists(io, roomName) {
  try {
    const count = await getRoomMemberCount(io, roomName);
    return count > 0;
  } catch (error) {
    logger.error('Error checking room existence', {
      error: error.message,
      roomName
    });
    return false;
  }
}

/**
 * Remove all members from a room
 * @param {Object} io - Socket.io server instance
 * @param {String} roomName - Room name
 * @returns {Promise<Number>} Number of members removed
 */
async function clearRoom(io, roomName) {
  try {
    if (!io) {
      throw new Error('Socket.io instance is required');
    }

    if (!roomName) {
      throw new Error('Room name is required');
    }

    const sockets = await io.in(roomName).fetchSockets();
    let removedCount = 0;

    for (const socket of sockets) {
      socket.leave(roomName);
      removedCount++;
    }

    logger.info('Cleared room', {
      roomName,
      removedCount
    });

    return removedCount;
  } catch (error) {
    logger.error('Error clearing room', {
      error: error.message,
      roomName
    });
    throw error;
  }
}

/**
 * Join vendor-specific room
 * @param {Object} socket - Socket instance
 * @param {String} vendorId - Vendor ID
 */
function joinVendorRoom(socket, vendorId) {
  try {
    if (!socket) {
      throw new Error('Socket instance is required');
    }

    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const roomName = `vendor:${vendorId}`;
    socket.join(roomName);

    logger.debug('User joined vendor room', {
      userId: socket.userId,
      role: socket.role,
      socketId: socket.id,
      vendorId,
      roomName
    });

    return true;
  } catch (error) {
    logger.error('Error joining vendor room', {
      error: error.message,
      userId: socket?.userId,
      socketId: socket?.id,
      vendorId
    });
    throw error;
  }
}

/**
 * Leave vendor-specific room
 * @param {Object} socket - Socket instance
 * @param {String} vendorId - Vendor ID
 */
function leaveVendorRoom(socket, vendorId) {
  try {
    if (!socket) {
      throw new Error('Socket instance is required');
    }

    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const roomName = `vendor:${vendorId}`;
    socket.leave(roomName);

    logger.debug('User left vendor room', {
      userId: socket.userId,
      role: socket.role,
      socketId: socket.id,
      vendorId,
      roomName
    });

    return true;
  } catch (error) {
    logger.error('Error leaving vendor room', {
      error: error.message,
      userId: socket?.userId,
      socketId: socket?.id,
      vendorId
    });
    throw error;
  }
}

module.exports = {
  joinAdminRoom,
  joinOrderRoom,
  leaveOrderRoom,
  joinCourierTrackingRoom,
  getRoomMembers,
  getRoomMemberCount,
  roomExists,
  clearRoom,
  joinVendorRoom,
  leaveVendorRoom
};
