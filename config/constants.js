/**
 * Application constants
 */

// User roles
const ROLES = {
  CUSTOMER: 'customer',
  COURIER: 'courier',
  ADMIN: 'admin'
};

// Order statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Payment types
const PAYMENT_TYPES = {
  CASH: 'cash',
  CARD: 'card'
};

// Bot types
const BOT_TYPES = {
  CUSTOMER: 'customer',
  COURIER: 'courier',
  ADMIN: 'admin'
};

// Session states for customer bot
const CUSTOMER_STATES = {
  MAIN_MENU: 'main_menu',
  AWAITING_PHONE: 'awaiting_phone',
  AWAITING_LOCATION: 'awaiting_location',
  AWAITING_ORDER_DETAILS: 'awaiting_order_details',
  AWAITING_PAYMENT_TYPE: 'awaiting_payment_type',
  CONFIRMATION: 'confirmation',
  EDITING: 'editing'
};

// Session states for courier bot
const COURIER_STATES = {
  MAIN_MENU: 'main_menu',
  VIEWING_ORDERS: 'viewing_orders',
  ORDER_ACCEPTED: 'order_accepted'
};

// Session states for admin bot
const ADMIN_STATES = {
  MAIN_MENU: 'main_menu',
  VIEWING_ORDERS: 'viewing_orders',
  MANAGING_COURIERS: 'managing_couriers',
  VIEWING_STATISTICS: 'viewing_statistics',
  SETTINGS: 'settings'
};

// Session expiration time (30 minutes)
const SESSION_EXPIRATION = 30 * 60 * 1000;

// Rate limiting
const RATE_LIMIT = {
  POINTS: 5, // Number of points
  DURATION: 60, // Per 60 seconds
  BLOCK_DURATION: 60 // Block for 60 seconds
};

// Parkent district approximate boundaries (for basic validation)
const PARKENT_BOUNDARIES = {
  MIN_LAT: 41.2,
  MAX_LAT: 41.4,
  MIN_LON: 69.6,
  MAX_LON: 69.8
};

module.exports = {
  ROLES,
  ORDER_STATUS,
  PAYMENT_TYPES,
  BOT_TYPES,
  CUSTOMER_STATES,
  COURIER_STATES,
  ADMIN_STATES,
  SESSION_EXPIRATION,
  RATE_LIMIT,
  PARKENT_BOUNDARIES
};
