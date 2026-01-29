const messages = require('../messages/uzbek.messages');

function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📦 Mavjud buyurtmalar' }],
        [{ text: '📊 Statistikam' }],
        [{ text: '⚙️ Sozlamalar' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

function availableOrders(orders) {
  const keyboard = [];
  
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const distance = order.distance ? `${order.distance.toFixed(1)} km` : '';
      const fee = order.deliveryFee ? `${order.deliveryFee} so'm` : '';
      keyboard.push([{
        text: `📦 #${order.orderNumber} - ${distance} - ${fee}`,
        callback_data: `courier_view_order:${order._id}`
      }]);
    });
  }
  
  keyboard.push([{
    text: '🔄 Yangilash',
    callback_data: 'courier_refresh_orders'
  }]);
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'courier_main'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function orderActions(orderId, currentStatus) {
  const keyboard = [];
  
  if (currentStatus === 'ready' || currentStatus === 'assigned') {
    keyboard.push([{
      text: '✅ Qabul qilish',
      callback_data: `courier_accept:${orderId}`
    }]);
  }
  
  if (currentStatus === 'assigned') {
    keyboard.push([{
      text: '📦 Oldim',
      callback_data: `courier_pickup:${orderId}`
    }]);
  }
  
  if (currentStatus === 'picked_up' || currentStatus === 'in_transit') {
    keyboard.push([
      {
        text: '📍 Lokatsiyamni ulashish',
        callback_data: `courier_share_location:${orderId}`
      }
    ]);
  }
  
  if (currentStatus === 'picked_up' || currentStatus === 'in_transit') {
    keyboard.push([{
      text: '✅ Yetkazdim',
      callback_data: `courier_deliver:${orderId}`
    }]);
  }
  
  keyboard.push([{
    text: messages.back,
    callback_data: 'courier_available_orders'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function shareLocation() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📍 Jonli lokatsiyani ulashish', request_location: true }],
        [{ text: messages.cancel }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

function confirmPickup(orderId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Ha, oldim', callback_data: `confirm_pickup:${orderId}` },
          { text: '❌ Yo\'q', callback_data: `courier_view_order:${orderId}` }
        ]
      ]
    }
  };
}

function confirmDelivery(orderId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Ha, yetkazdim', callback_data: `confirm_delivery:${orderId}` },
          { text: '❌ Yo\'q', callback_data: `courier_view_order:${orderId}` }
        ]
      ]
    }
  };
}

function activeOrderActions(orderId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📍 Manzilni ko\'rish', callback_data: `view_address:${orderId}` }],
        [{ text: '📞 Mijozga qo\'ng\'iroq qilish', callback_data: `call_customer:${orderId}` }],
        [{ text: '📍 Yo\'lni ko\'rish', callback_data: `view_route:${orderId}` }],
        [{ text: messages.back, callback_data: 'courier_main' }]
      ]
    }
  };
}

function statisticsMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📅 Bugun', callback_data: 'courier_stats:today' },
          { text: '📅 Hafta', callback_data: 'courier_stats:week' }
        ],
        [
          { text: '📅 Oy', callback_data: 'courier_stats:month' },
          { text: '📅 Jami', callback_data: 'courier_stats:all' }
        ],
        [{ text: messages.backToMainMenu, callback_data: 'courier_main' }]
      ]
    }
  };
}

function myActiveOrders(orders) {
  const keyboard = [];
  
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const statusEmoji = getStatusEmoji(order.status);
      keyboard.push([{
        text: `${statusEmoji} #${order.orderNumber}`,
        callback_data: `courier_my_order:${order._id}`
      }]);
    });
  }
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'courier_main'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function orderDirections(order) {
  const keyboard = [];
  
  if (order.vendor?.address?.location) {
    const coords = order.vendor.address.location.coordinates;
    keyboard.push([{
      text: '🏪 Do\'kon joylashuvi',
      url: `https://maps.google.com/?q=${coords[1]},${coords[0]}`
    }]);
  }
  
  if (order.deliveryAddress?.location) {
    const coords = order.deliveryAddress.location.coordinates;
    keyboard.push([{
      text: '🏠 Yetkazib berish manzili',
      url: `https://maps.google.com/?q=${coords[1]},${coords[0]}`
    }]);
  }
  
  keyboard.push([{
    text: messages.back,
    callback_data: `courier_view_order:${order._id}`
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function getStatusEmoji(status) {
  const emojiMap = {
    'pending': '⏳',
    'confirmed': '✅',
    'preparing': '👨‍🍳',
    'ready': '✅',
    'assigned': '🚴',
    'picked_up': '📦',
    'in_transit': '🚗',
    'delivered': '🎉',
    'cancelled': '❌',
    'rejected': '❌'
  };
  return emojiMap[status] || '📦';
}

module.exports = {
  mainMenu,
  availableOrders,
  orderActions,
  shareLocation,
  confirmPickup,
  confirmDelivery,
  activeOrderActions,
  statisticsMenu,
  myActiveOrders,
  orderDirections
};
