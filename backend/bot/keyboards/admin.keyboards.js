const messages = require('../messages/uzbek.messages');

function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📦 Buyurtmalar' }, { text: '🏪 Do\'konlar' }],
        [{ text: '🚴 Kurerlar' }, { text: '👥 Foydalanuvchilar' }],
        [{ text: '📊 Statistika' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

function orderFilters() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⏳ Kutilmoqda', callback_data: 'admin_orders:pending' },
          { text: '✅ Tasdiqlangan', callback_data: 'admin_orders:confirmed' }
        ],
        [
          { text: '👨‍🍳 Tayyorlanmoqda', callback_data: 'admin_orders:preparing' },
          { text: '✅ Tayyor', callback_data: 'admin_orders:ready' }
        ],
        [
          { text: '🚴 Tayinlangan', callback_data: 'admin_orders:assigned' },
          { text: '📦 Yo\'lda', callback_data: 'admin_orders:in_transit' }
        ],
        [
          { text: '🎉 Yetkazilgan', callback_data: 'admin_orders:delivered' },
          { text: '❌ Bekor qilingan', callback_data: 'admin_orders:cancelled' }
        ],
        [{ text: '📦 Hammasi', callback_data: 'admin_orders:all' }],
        [{ text: messages.backToMainMenu, callback_data: 'admin_main' }]
      ]
    }
  };
}

function ordersList(orders) {
  const keyboard = [];
  
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const statusEmoji = getStatusEmoji(order.status);
      keyboard.push([{
        text: `${statusEmoji} #${order.orderNumber} - ${order.vendor?.name || 'N/A'}`,
        callback_data: `admin_order:${order._id}`
      }]);
    });
  }
  
  keyboard.push([{
    text: messages.back,
    callback_data: 'admin_order_filters'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function orderActions(orderId, currentStatus) {
  const keyboard = [];
  
  keyboard.push([{
    text: '📋 Tafsilotlar',
    callback_data: `admin_order_details:${orderId}`
  }]);
  
  if (!['delivered', 'cancelled', 'rejected'].includes(currentStatus)) {
    keyboard.push([{
      text: '🚴 Kurier tayinlash',
      callback_data: `admin_assign_courier:${orderId}`
    }]);
  }
  
  if (!['delivered', 'cancelled', 'rejected'].includes(currentStatus)) {
    keyboard.push([{
      text: '❌ Bekor qilish',
      callback_data: `admin_cancel_order:${orderId}`
    }]);
  }
  
  keyboard.push([{
    text: messages.back,
    callback_data: 'admin_orders:all'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function vendorActions(vendorId, isActive) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 Tafsilotlar', callback_data: `admin_vendor_details:${vendorId}` },
          { text: isActive ? '❌ O\'chirish' : '✅ Yoqish', callback_data: `admin_toggle_vendor:${vendorId}` }
        ],
        [
          { text: '✏️ Tahrirlash', callback_data: `admin_edit_vendor:${vendorId}` },
          { text: '🗑️ O\'chirish', callback_data: `admin_delete_vendor:${vendorId}` }
        ],
        [{ text: messages.back, callback_data: 'admin_vendors' }]
      ]
    }
  };
}

function vendorsList(vendors) {
  const keyboard = [];
  
  if (vendors && vendors.length > 0) {
    vendors.forEach(vendor => {
      const status = vendor.isActive ? '✅' : '❌';
      keyboard.push([{
        text: `${status} ${vendor.name}`,
        callback_data: `admin_vendor:${vendor._id}`
      }]);
    });
  }
  
  keyboard.push([{
    text: '➕ Yangi do\'kon qo\'shish',
    callback_data: 'admin_add_vendor'
  }]);
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'admin_main'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function courierActions(courierId, isActive) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 Tafsilotlar', callback_data: `admin_courier_details:${courierId}` },
          { text: isActive ? '❌ O\'chirish' : '✅ Yoqish', callback_data: `admin_toggle_courier:${courierId}` }
        ],
        [
          { text: '📊 Statistika', callback_data: `admin_courier_stats:${courierId}` }
        ],
        [{ text: messages.back, callback_data: 'admin_couriers' }]
      ]
    }
  };
}

function couriersList(couriers) {
  const keyboard = [];
  
  if (couriers && couriers.length > 0) {
    couriers.forEach(courier => {
      const status = courier.isActive ? '✅' : '❌';
      const busy = courier.currentOrder ? '🔴' : '🟢';
      keyboard.push([{
        text: `${status} ${busy} ${courier.firstName} ${courier.lastName || ''}`,
        callback_data: `admin_courier:${courier._id}`
      }]);
    });
  }
  
  keyboard.push([{
    text: '➕ Yangi kurier qo\'shish',
    callback_data: 'admin_add_courier'
  }]);
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'admin_main'
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function availableCouriers(couriers, orderId) {
  const keyboard = [];
  
  if (couriers && couriers.length > 0) {
    couriers.forEach(courier => {
      const busy = courier.currentOrder ? '🔴' : '🟢';
      keyboard.push([{
        text: `${busy} ${courier.firstName} ${courier.lastName || ''}`,
        callback_data: `assign_courier:${orderId}:${courier._id}`
      }]);
    });
  }
  
  keyboard.push([{
    text: messages.back,
    callback_data: `admin_order:${orderId}`
  }]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function confirmAction(action, targetId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Ha', callback_data: `admin_confirm:${action}:${targetId}` },
          { text: '❌ Yo\'q', callback_data: `admin_cancel:${action}:${targetId}` }
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
          { text: '📅 Bugun', callback_data: 'admin_stats:today' },
          { text: '📅 Hafta', callback_data: 'admin_stats:week' }
        ],
        [
          { text: '📅 Oy', callback_data: 'admin_stats:month' },
          { text: '📅 Jami', callback_data: 'admin_stats:all' }
        ],
        [{ text: messages.backToMainMenu, callback_data: 'admin_main' }]
      ]
    }
  };
}

function usersList(users, role = 'all') {
  const keyboard = [];
  
  if (users && users.length > 0) {
    users.forEach(user => {
      const roleEmoji = getRoleEmoji(user.role);
      const status = user.isActive ? '✅' : '❌';
      keyboard.push([{
        text: `${status} ${roleEmoji} ${user.firstName} ${user.lastName || ''}`,
        callback_data: `admin_user:${user._id}`
      }]);
    });
  }
  
  keyboard.push([
    { text: '👥 Hammasi', callback_data: 'admin_users:all' },
    { text: '🛍️ Mijozlar', callback_data: 'admin_users:customer' }
  ]);
  
  keyboard.push([{
    text: messages.backToMainMenu,
    callback_data: 'admin_main'
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

function getRoleEmoji(role) {
  const emojiMap = {
    'customer': '🛍️',
    'vendor': '🏪',
    'courier': '🚴',
    'admin': '👨‍💼'
  };
  return emojiMap[role] || '👤';
}

module.exports = {
  mainMenu,
  orderFilters,
  ordersList,
  orderActions,
  vendorActions,
  vendorsList,
  courierActions,
  couriersList,
  availableCouriers,
  confirmAction,
  statisticsMenu,
  usersList
};
