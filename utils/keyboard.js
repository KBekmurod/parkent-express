/**
 * Keyboard utilities for inline keyboards
 */

/**
 * Customer Bot Keyboards
 */
const customerKeyboards = {
  // Main menu
  mainMenu: () => ({
    inline_keyboard: [
      [{ text: '🛒 Buyurtma berish', callback_data: 'place_order' }],
      [{ text: '📦 Buyurtmalarim', callback_data: 'my_orders' }],
      [{ text: 'ℹ️ Yordam', callback_data: 'help' }]
    ]
  }),

  // Payment type selection
  paymentType: () => ({
    inline_keyboard: [
      [{ text: '💵 Naqd', callback_data: 'payment_cash' }],
      [{ text: '💳 Kurer kartasiga', callback_data: 'payment_card' }],
      [{ text: '⬅️ Ortga', callback_data: 'back' }],
      [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]
    ]
  }),

  // Order confirmation
  confirmation: () => ({
    inline_keyboard: [
      [{ text: '✅ Tasdiqlash', callback_data: 'confirm_order' }],
      [{ text: '✏️ Tahrirlash', callback_data: 'edit_order' }],
      [{ text: '❌ Bekor qilish', callback_data: 'cancel_order' }]
    ]
  }),

  // Edit options
  editOptions: () => ({
    inline_keyboard: [
      [{ text: '📍 Manzilni o\'zgartirish', callback_data: 'edit_location' }],
      [{ text: '📝 Buyurtmani o\'zgartirish', callback_data: 'edit_details' }],
      [{ text: '💰 To\'lov turini o\'zgartirish', callback_data: 'edit_payment' }],
      [{ text: '⬅️ Ortga', callback_data: 'back_to_confirmation' }]
    ]
  }),

  // Navigation buttons
  backAndMainMenu: () => ({
    inline_keyboard: [
      [{ text: '⬅️ Ortga', callback_data: 'back' }],
      [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]
    ]
  }),

  // Request phone number
  requestPhone: () => ({
    keyboard: [
      [{ text: '📱 Telefon raqamni yuborish', request_contact: true }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  }),

  // Request location
  requestLocation: () => ({
    keyboard: [
      [{ text: '📍 Manzilni yuborish', request_location: true }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  })
};

/**
 * Courier Bot Keyboards
 */
const courierKeyboards = {
  // Main menu
  mainMenu: () => ({
    inline_keyboard: [
      [{ text: '🚚 Buyurtmalar', callback_data: 'view_orders' }],
      [{ text: '📊 Statistikam', callback_data: 'my_stats' }]
    ]
  }),

  // Order actions
  orderActions: (orderId) => ({
    inline_keyboard: [
      [{ text: '✅ Qabul qilish', callback_data: `accept_${orderId}` }],
      [{ text: '❌ O\'tkazib yuborish', callback_data: 'skip_order' }],
      [{ text: '⬅️ Ortga', callback_data: 'main_menu' }]
    ]
  }),

  // Delivery actions
  deliveryActions: (orderId) => ({
    inline_keyboard: [
      [{ text: '🚴 Yo\'ldaman', callback_data: `on_way_${orderId}` }],
      [{ text: '📦 Yetkazdim', callback_data: `delivered_${orderId}` }],
      [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]
    ]
  }),

  // Back to main menu
  backToMainMenu: () => ({
    inline_keyboard: [
      [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]
    ]
  })
};

/**
 * Admin Bot Keyboards
 */
const adminKeyboards = {
  // Main menu
  mainMenu: () => ({
    inline_keyboard: [
      [{ text: '📋 Buyurtmalar', callback_data: 'admin_orders' }],
      [{ text: '👨‍✈️ Kurerlar', callback_data: 'admin_couriers' }],
      [{ text: '📊 Statistika', callback_data: 'admin_stats' }],
      [{ text: '⚙️ Sozlamalar', callback_data: 'admin_settings' }]
    ]
  }),

  // Order filters
  orderFilters: () => ({
    inline_keyboard: [
      [{ text: 'Barchasi', callback_data: 'filter_all' }],
      [{ text: 'Kutilmoqda', callback_data: 'filter_pending' }],
      [{ text: 'Yo\'lda', callback_data: 'filter_delivering' }],
      [{ text: 'Yetkazildi', callback_data: 'filter_delivered' }],
      [{ text: '⬅️ Ortga', callback_data: 'main_menu' }]
    ]
  }),

  // Courier management
  courierManagement: () => ({
    inline_keyboard: [
      [{ text: '➕ Kurer qo\'shish', callback_data: 'add_courier' }],
      [{ text: '📋 Kurerlar ro\'yxati', callback_data: 'list_couriers' }],
      [{ text: '⬅️ Ortga', callback_data: 'main_menu' }]
    ]
  }),

  // Back to main menu
  backToMainMenu: () => ({
    inline_keyboard: [
      [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]
    ]
  })
};

module.exports = {
  customerKeyboards,
  courierKeyboards,
  adminKeyboards
};
