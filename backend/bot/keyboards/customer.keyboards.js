const messages = require('../messages/uzbek.messages');

function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🛍️ Buyurtma berish' }],
        [{ text: '📦 Mening buyurtmalarim' }],
        [{ text: '❓ Yordam' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

function vendorsList(vendors) {
  const keyboard = [];
  
  vendors.forEach(vendor => {
    const status = vendor.isOpen ? '🟢' : '🔴';
    keyboard.push([{
      text: `${status} ${vendor.name}`,
      callback_data: `select_vendor:${vendor._id}`
    }]);
  });
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'back_to_main'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function paymentTypes() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: messages.paymentCash, callback_data: 'payment:cash' },
          { text: messages.paymentCard, callback_data: 'payment:card' }
        ],
        [{ text: messages.back, callback_data: 'order_back:payment' }]
      ]
    }
  };
}

function orderConfirmation() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: messages.confirm, callback_data: 'order_confirm' }],
        [
          { text: messages.edit, callback_data: 'order_edit' },
          { text: messages.cancel, callback_data: 'order_cancel' }
        ]
      ]
    }
  };
}

function orderEditOptions() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏪 Do\'kon', callback_data: 'edit_field:vendor' }],
        [{ text: '📍 Manzil', callback_data: 'edit_field:location' }],
        [{ text: '📝 Tafsilotlar', callback_data: 'edit_field:details' }],
        [{ text: '💳 To\'lov usuli', callback_data: 'edit_field:payment' }],
        [{ text: messages.back, callback_data: 'order_back:confirm' }]
      ]
    }
  };
}

function myOrders(orders) {
  const keyboard = [];
  
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const statusEmoji = getStatusEmoji(order.status);
      keyboard.push([{
        text: `${statusEmoji} #${order.orderNumber} - ${order.vendor?.name || 'Noma\'lum'}`,
        callback_data: `view_order:${order._id}`
      }]);
    });
  }
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'back_to_main'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function orderDetails(order) {
  const keyboard = [];
  
  if (order.canBeCancelled) {
    keyboard.push([{
      text: '❌ Buyurtmani bekor qilish',
      callback_data: `cancel_order:${order._id}`
    }]);
  }
  
  if (order.isActive && ['assigned', 'picked_up', 'in_transit'].includes(order.status)) {
    keyboard.push([{
      text: '📍 Kurerni kuzatish',
      callback_data: `track_order:${order._id}`
    }]);
  }
  
  if (order.status === 'delivered' && !order.rating?.vendor) {
    keyboard.push([{
      text: '⭐ Baholash',
      callback_data: `rate_order:${order._id}`
    }]);
  }
  
  keyboard.push([{
    text: messages.back,
    callback_data: 'my_orders'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function locationRequest() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📍 Joylashuvimni yuborish', request_location: true }],
        [{ text: messages.cancel }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

function confirmCancellation(orderId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Ha, bekor qilish', callback_data: `confirm_cancel:${orderId}` },
          { text: '❌ Yo\'q', callback_data: `view_order:${orderId}` }
        ]
      ]
    }
  };
}

function ratingKeyboard(orderId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⭐', callback_data: `rate:${orderId}:1` },
          { text: '⭐⭐', callback_data: `rate:${orderId}:2` },
          { text: '⭐⭐⭐', callback_data: `rate:${orderId}:3` }
        ],
        [
          { text: '⭐⭐⭐⭐', callback_data: `rate:${orderId}:4` },
          { text: '⭐⭐⭐⭐⭐', callback_data: `rate:${orderId}:5` }
        ],
        [{ text: messages.skip, callback_data: `view_order:${orderId}` }]
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

module.exports = {
  mainMenu,
  vendorsList,
  paymentTypes,
  orderConfirmation,
  orderEditOptions,
  myOrders,
  orderDetails,
  locationRequest,
  confirmCancellation,
  ratingKeyboard
};
