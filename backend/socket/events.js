module.exports = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
  
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_ACCEPT: 'order:accept',
  ORDER_REJECT: 'order:reject',
  ORDER_CANCEL: 'order:cancel',
  
  COURIER_ONLINE: 'courier:online',
  COURIER_OFFLINE: 'courier:offline',
  COURIER_LOCATION_UPDATE: 'courier:location_update',
  COURIER_LOCATION_UPDATED: 'courier:location_updated',
  COURIER_STATUS_CHANGED: 'courier:status_changed',
  COURIER_ACCEPT_ORDER: 'courier:accept_order',
  COURIER_ARRIVED: 'courier:arrived',
  
  NEW_ORDER: 'new:order',
  MESSAGE: 'message',
  NOTIFICATION: 'notification',
  
  ADMIN_STATS_REQUEST: 'admin:stats_request',
  ADMIN_STATS_RESPONSE: 'admin:stats_response'
};
