const messages = require('../messages/uzbek.messages');

function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📦 Buyurtmalar' }],
        [{ text: '📊 Statistika' }, { text: '🍽️ Mahsulotlar' }],
        [{ text: '⚙️ Sozlamalar' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

function orderActions(orderId, currentStatus) {
  const keyboard = [];
  
  if (currentStatus === 'pending') {
    keyboard.push([
      { text: '✅ Qabul qilish', callback_data: `vendor_accept:${orderId}` },
      { text: '❌ Rad etish', callback_data: `vendor_reject:${orderId}` }
    ]);
  }
  
  if (currentStatus === 'confirmed') {
    keyboard.push([{
      text: '👨‍🍳 Tayyorlashni boshlash',
      callback_data: `vendor_status:${orderId}:preparing`
    }]);
  }
  
  if (currentStatus === 'preparing') {
    keyboard.push([{
      text: '✅ Tayyor',
      callback_data: `vendor_status:${orderId}:ready`
    }]);
  }
  
  keyboard.push([{
    text: messages.back,
    callback_data: 'vendor_orders'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function orderStatus(orderId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👨‍🍳 Tayyorlanmoqda', callback_data: `set_status:${orderId}:preparing` }
        ],
        [
          { text: '✅ Tayyor', callback_data: `set_status:${orderId}:ready` }
        ],
        [{ text: messages.back, callback_data: `vendor_order:${orderId}` }]
      ]
    }
  };
}

function ordersList(orders, filter = 'all') {
  const keyboard = [];
  
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const statusEmoji = getStatusEmoji(order.status);
      const timeAgo = getTimeAgo(order.createdAt);
      keyboard.push([{
        text: `${statusEmoji} #${order.orderNumber} - ${timeAgo}`,
        callback_data: `vendor_order:${order._id}`
      }]);
    });
  }
  
  keyboard.push([
    { text: '⏳ Kutilmoqda', callback_data: 'vendor_filter:pending' },
    { text: '👨‍🍳 Tayyorlanmoqda', callback_data: 'vendor_filter:preparing' }
  ]);
  keyboard.push([
    { text: '✅ Tayyor', callback_data: 'vendor_filter:ready' },
    { text: '📦 Hammasi', callback_data: 'vendor_filter:all' }
  ]);
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'vendor_main'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function productsList(products) {
  const keyboard = [];
  
  if (products && products.length > 0) {
    products.forEach(product => {
      const status = product.isAvailable ? '✅' : '❌';
      keyboard.push([{
        text: `${status} ${product.name} - ${product.price} so'm`,
        callback_data: `vendor_product:${product._id}`
      }]);
    });
  }
  
  keyboard.push([{
    text: '➕ Yangi mahsulot qo\'shish',
    callback_data: 'vendor_add_product'
  }]);
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'vendor_main'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function productActions(productId, isAvailable) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Tahrirlash', callback_data: `edit_product:${productId}` },
          { text: isAvailable ? '❌ O\'chirish' : '✅ Yoqish', callback_data: `toggle_product:${productId}` }
        ],
        [
          { text: '🗑️ O\'chirish', callback_data: `delete_product:${productId}` }
        ],
        [{ text: messages.back, callback_data: 'vendor_products' }]
      ]
    }
  };
}

function acceptOrderOptions(orderId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '15 daq', callback_data: `accept_time:${orderId}:15` },
          { text: '30 daq', callback_data: `accept_time:${orderId}:30` }
        ],
        [
          { text: '45 daq', callback_data: `accept_time:${orderId}:45` },
          { text: '60 daq', callback_data: `accept_time:${orderId}:60` }
        ],
        [{ text: messages.back, callback_data: `vendor_order:${orderId}` }]
      ]
    }
  };
}

function confirmAction(action, data) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Ha', callback_data: `confirm:${action}:${data}` },
          { text: '❌ Yo\'q', callback_data: `cancel:${action}:${data}` }
        ]
      ]
    }
  };
}

function statisticsMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📅 Bugun', callback_data: 'vendor_stats:today' },
          { text: '📅 Hafta', callback_data: 'vendor_stats:week' }
        ],
        [
          { text: '📅 Oy', callback_data: 'vendor_stats:month' },
          { text: '📅 Jami', callback_data: 'vendor_stats:all' }
        ],
        [{ text: messages.backToMainMenu, callback_data: 'vendor_main' }]
      ]
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

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return `${seconds} soniya oldin`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} daqiqa oldin`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} soat oldin`;
  return `${Math.floor(seconds / 86400)} kun oldin`;
}

module.exports = {
  mainMenu,
  orderActions,
  orderStatus,
  ordersList,
  productsList,
  productActions,
  acceptOrderOptions,
  confirmAction,
  statisticsMenu
};
