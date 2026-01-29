module.exports = {
  // User Roles
  ROLES: {
    CUSTOMER: 'customer',
    VENDOR: 'vendor',
    COURIER: 'courier',
    ADMIN: 'admin'
  },

  // Order Statuses
  ORDER_STATUSES: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    PREPARING: 'preparing',
    READY: 'ready',
    ASSIGNED: 'assigned',
    PICKED_UP: 'picked_up',
    DELIVERING: 'delivering',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Payment Types
  PAYMENT_TYPES: {
    CASH: 'cash',
    CARD: 'card'
  },

  // Payment Statuses
  PAYMENT_STATUSES: {
    PENDING: 'pending',
    PAID: 'paid',
    REFUNDED: 'refunded',
    FAILED: 'failed'
  },

  // Order Status Flow
  ORDER_STATUS_FLOW: {
    pending: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled'],
    picked_up: ['delivering', 'cancelled'],
    delivering: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    ORDER_CREATED: 'order_created',
    ORDER_ACCEPTED: 'order_accepted',
    ORDER_PREPARING: 'order_preparing',
    ORDER_READY: 'order_ready',
    ORDER_ASSIGNED: 'order_assigned',
    ORDER_PICKED_UP: 'order_picked_up',
    ORDER_DELIVERING: 'order_delivering',
    ORDER_COMPLETED: 'order_completed',
    ORDER_CANCELLED: 'order_cancelled',
    COURIER_ASSIGNED: 'courier_assigned',
    PAYMENT_RECEIVED: 'payment_received'
  },

  // Socket Events
  SOCKET_EVENTS: {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    ORDER_UPDATE: 'order:update',
    ORDER_NEW: 'order:new',
    ORDER_ASSIGNED: 'order:assigned',
    LOCATION_UPDATE: 'location:update',
    COURIER_ONLINE: 'courier:online',
    COURIER_OFFLINE: 'courier:offline',
    ERROR: 'error'
  },

  // Courier Status
  COURIER_STATUS: {
    OFFLINE: 'offline',
    ONLINE: 'online',
    BUSY: 'busy'
  },

  // Vendor Status
  VENDOR_STATUS: {
    CLOSED: 'closed',
    OPEN: 'open',
    BUSY: 'busy'
  },

  // Time Limits (in minutes)
  TIME_LIMITS: {
    ORDER_ACCEPTANCE: 10,
    ORDER_PREPARATION: 60,
    ORDER_PICKUP: 15,
    ORDER_DELIVERY: 60
  },

  // Distance Limits (in kilometers)
  DISTANCE_LIMITS: {
    MAX_DELIVERY_DISTANCE: 50,
    COURIER_SEARCH_RADIUS: 10
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // Rate Limiting
  RATE_LIMITS: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },

  // JWT
  JWT: {
    ACCESS_TOKEN_EXPIRY: '24h',
    REFRESH_TOKEN_EXPIRY: '7d'
  },

  // File Upload
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp']
  },

  // Commission Rates (in percentage)
  COMMISSION: {
    VENDOR: 15,
    COURIER: 10
  },

  // Default Values
  DEFAULTS: {
    CURRENCY: 'UZS',
    LANGUAGE: 'uz',
    TIMEZONE: 'Asia/Tashkent'
  },

  // Error Codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    DUPLICATE_ERROR: 'DUPLICATE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
    CONFLICT: 'CONFLICT'
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // Regex Patterns
  REGEX: {
    PHONE: /^\+998[0-9]{9}$/,
    ORDER_NUMBER: /^PE[0-9]{8}$/,
    TELEGRAM_ID: /^[0-9]{5,15}$/
  },

  // Environment
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test'
  }
};
