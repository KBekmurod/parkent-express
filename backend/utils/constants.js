module.exports = {
  USER_ROLES: {
    CUSTOMER: 'customer',
    VENDOR: 'vendor',
    COURIER: 'courier',
    ADMIN: 'admin'
  },
  
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    ASSIGNED: 'assigned',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected'
  },
  
  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    ONLINE: 'online'
  },
  
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  
  COURIER_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    REJECTED: 'rejected'
  },
  
  VEHICLE_TYPES: {
    BICYCLE: 'bicycle',
    MOTORCYCLE: 'motorcycle',
    SCOOTER: 'scooter',
    CAR: 'car'
  },
  
  VENDOR_CATEGORIES: {
    RESTAURANT: 'restaurant',
    CAFE: 'cafe',
    GROCERY: 'grocery',
    PHARMACY: 'pharmacy',
    ELECTRONICS: 'electronics',
    CLOTHING: 'clothing',
    OTHER: 'other'
  },
  
  SESSION_TYPES: {
    REGISTRATION: 'registration',
    ORDER_CREATION: 'order_creation',
    VENDOR_REGISTRATION: 'vendor_registration',
    COURIER_REGISTRATION: 'courier_registration',
    PRODUCT_CREATION: 'product_creation',
    PROFILE_UPDATE: 'profile_update',
    ADDRESS_INPUT: 'address_input',
    PAYMENT_SELECTION: 'payment_selection',
    RATING_SUBMISSION: 'rating_submission',
    SUPPORT_CHAT: 'support_chat',
    OTHER: 'other'
  },
  
  SESSION_STATES: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
  },
  
  LANGUAGES: {
    UZ: 'uz',
    RU: 'ru',
    EN: 'en'
  },
  
  NOTIFICATION_TYPES: {
    ORDER_CREATED: 'order_created',
    ORDER_CONFIRMED: 'order_confirmed',
    ORDER_PREPARING: 'order_preparing',
    ORDER_READY: 'order_ready',
    ORDER_ASSIGNED: 'order_assigned',
    ORDER_PICKED_UP: 'order_picked_up',
    ORDER_IN_TRANSIT: 'order_in_transit',
    ORDER_DELIVERED: 'order_delivered',
    ORDER_CANCELLED: 'order_cancelled',
    ORDER_REJECTED: 'order_rejected',
    NEW_ORDER_AVAILABLE: 'new_order_available',
    COURIER_ARRIVED: 'courier_arrived',
    PROMOTION: 'promotion'
  },
  
  SOCKET_EVENTS: {
    ORDER_CREATED: 'order:created',
    ORDER_UPDATED: 'order:updated',
    ORDER_STATUS_CHANGED: 'order:status_changed',
    COURIER_LOCATION_UPDATED: 'courier:location_updated',
    COURIER_STATUS_CHANGED: 'courier:status_changed',
    NEW_ORDER: 'new:order',
    MESSAGE: 'message',
    NOTIFICATION: 'notification',
    ERROR: 'error'
  },
  
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ERROR: 'DUPLICATE_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
  },
  
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
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },
  
  PARKENT_BOUNDS: {
    CENTER: {
      LAT: 41.299164,
      LON: 69.685219
    },
    MAX_RADIUS_KM: 10,
    MAX_RADIUS_METERS: 10000
  },
  
  DELIVERY_SETTINGS: {
    DEFAULT_DELIVERY_FEE: 5000,
    DEFAULT_PREPARATION_TIME: 30,
    MAX_DELIVERY_DISTANCE_KM: 10,
    COMMISSION_RATE: 0.10
  }
};
