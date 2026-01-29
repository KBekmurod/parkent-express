/**
 * Message templates in Uzbek language
 */

const messages = {
  // Customer Bot Messages
  customer: {
    welcome: '🎉 Parkent Express ga xush kelibsiz!\n\nBuyurtma berish uchun quyidagi tugmalardan birini tanlang:',
    
    requestPhone: '📱 Iltimos, telefon raqamingizni yuboring.\n\nQuyidagi tugmani bosing yoki +998XXXXXXXXX formatida yuboring:',
    
    phoneReceived: '✅ Telefon raqamingiz qabul qilindi!',
    
    requestLocation: '📍 Iltimos, yetkazib berish manzilini yuboring.\n\nQuyidagi tugmani bosib, joylashuvingizni yuboring:',
    
    locationReceived: '✅ Manzil qabul qilindi!',
    
    requestOrderDetails: '📝 Iltimos, buyurtma tafsilotlarini kiriting.\n\nMasalan: "2 ta lavash, 1 ta cola"',
    
    orderDetailsReceived: '✅ Buyurtma tafsilotlari qabul qilindi!',
    
    selectPaymentType: '💰 To\'lov turini tanlang:',
    
    orderConfirmation: (order) => {
      const paymentText = order.paymentType === 'cash' ? 'Naqd' : 'Kurer kartasiga';
      return `📋 Buyurtmangizni tasdiqlang:\n\n` +
        `📍 Manzil: ${order.location.address || 'Lokatsiya yuborilgan'}\n` +
        `📝 Buyurtma: ${order.orderDetails}\n` +
        `💰 To'lov turi: ${paymentText}\n` +
        `📞 Telefon: ${order.customerPhone}\n\n` +
        `Tasdiqlaysizmi?`;
    },
    
    orderConfirmed: '✅ Buyurtmangiz qabul qilindi!\n\nTez orada kurer siz bilan bog\'lanadi.',
    
    orderCancelled: '❌ Buyurtma bekor qilindi.',
    
    selectEditOption: 'Nimani o\'zgartirmoqchisiz?',
    
    myOrdersEmpty: '📦 Sizda hozircha buyurtmalar yo\'q.',
    
    myOrdersList: '📦 Sizning buyurtmalaringiz:',
    
    orderStatus: (order) => {
      let statusText = '';
      switch(order.status) {
        case 'pending':
          statusText = '⏳ Kutilmoqda';
          break;
        case 'accepted':
          statusText = '✅ Qabul qilindi';
          break;
        case 'delivering':
          statusText = '🚴 Yo\'lda';
          break;
        case 'delivered':
          statusText = '✅ Yetkazildi';
          break;
        case 'cancelled':
          statusText = '❌ Bekor qilingan';
          break;
      }
      
      const paymentText = order.paymentType === 'cash' ? 'Naqd' : 'Kurer kartasiga';
      
      return `🆔 ${order._id}\n` +
        `📝 ${order.orderDetails}\n` +
        `💰 ${paymentText}\n` +
        `📅 ${order.createdAt.toLocaleDateString('uz-UZ')}\n` +
        `📊 Status: ${statusText}\n`;
    },
    
    helpMessage: `ℹ️ YORDAM\n\n` +
      `🛒 Buyurtma berish:\n` +
      `1. "Buyurtma berish" tugmasini bosing\n` +
      `2. Telefon raqamingizni yuboring\n` +
      `3. Manzilni yuboring\n` +
      `4. Buyurtma tafsilotlarini kiriting\n` +
      `5. To'lov turini tanlang\n` +
      `6. Buyurtmani tasdiqlang\n\n` +
      `📦 Buyurtmalaringizni ko'rish uchun "Buyurtmalarim" tugmasini bosing.\n\n` +
      `❓ Savollar uchun: @parkent_express_support`,
    
    activeOrderExists: '⚠️ Sizda allaqachon faol buyurtma mavjud. Avval uni tugatib, keyin yangi buyurtma bering.',
    
    rateLimitExceeded: (seconds) => `⏳ Juda ko'p so'rov. ${seconds} soniyadan keyin qayta urinib ko'ring.`,
    
    errorOccurred: '❌ Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
    
    invalidLocation: '⚠️ Bu manzil Parkent tumani chegarasidan tashqarida. Iltimos, Parkent tumani ichidagi manzilni yuboring.',
    
    orderDelivered: '✅ Buyurtmangiz yetkazildi! Parkent Express xizmatidan foydalanganingiz uchun rahmat! 🎉'
  },

  // Courier Bot Messages
  courier: {
    welcome: '👋 Xush kelibsiz, Kurer!\n\nBuyurtmalarni ko\'rish yoki statistikangizni tekshirish uchun quyidagi tugmalardan birini tanlang:',
    
    notAuthorized: '⛔ Siz kurer sifatida ro\'yxatdan o\'tmagansiz. Admin bilan bog\'laning.',
    
    noOrders: '📦 Hozircha yangi buyurtmalar yo\'q.',
    
    orderDetails: (order) => {
      const paymentText = order.paymentType === 'cash' ? 'Naqd' : 'Kurer kartasiga';
      return `📦 Yangi buyurtma:\n\n` +
        `📝 Buyurtma: ${order.orderDetails}\n` +
        `💰 To'lov: ${paymentText}\n` +
        `📞 Telefon: ${order.customerPhone}\n` +
        `📅 Vaqt: ${order.createdAt.toLocaleString('uz-UZ')}\n` +
        `🆔 ID: ${order._id}`;
    },
    
    orderAccepted: '✅ Buyurtma qabul qilindi!\n\nEndi mijozga borishingiz mumkin.',
    
    orderAlreadyTaken: '⚠️ Bu buyurtma boshqa kurer tomonidan qabul qilingan.',
    
    onTheWay: '🚴 Yo\'ldasiz deb belgilandi!',
    
    deliveryConfirmed: '✅ Yetkazildi deb belgilandi!\n\nAjoyib ish! 🎉',
    
    statistics: (stats) => {
      return `📊 STATISTIKA\n\n` +
        `📅 Bugun:\n` +
        `   📦 Yetkazilgan: ${stats.todayDeliveries || 0}\n` +
        `   💰 Summa: ${stats.todayEarnings || 0} so'm\n\n` +
        `📈 Umumiy:\n` +
        `   📦 Yetkazilgan: ${stats.totalDeliveries || 0}`;
    },
    
    noActiveOrders: '📦 Sizda hozirda faol buyurtmalar yo\'q.'
  },

  // Admin Bot Messages
  admin: {
    welcome: '👨‍💼 Admin panelga xush kelibsiz!\n\nTizimni boshqarish uchun quyidagi bo\'limlardan birini tanlang:',
    
    notAuthorized: '⛔ Sizda admin huquqlari yo\'q.',
    
    ordersTitle: '📋 BUYURTMALAR',
    
    noOrders: 'Buyurtmalar topilmadi.',
    
    ordersList: (orders) => {
      let text = '📋 Buyurtmalar ro\'yxati:\n\n';
      orders.forEach((order, index) => {
        const statusEmoji = {
          pending: '⏳',
          accepted: '✅',
          delivering: '🚴',
          delivered: '✅',
          cancelled: '❌'
        }[order.status] || '📦';
        
        text += `${index + 1}. ${statusEmoji} ${order.orderDetails.substring(0, 30)}...\n`;
        text += `   🆔 ${order._id}\n`;
        text += `   📅 ${order.createdAt.toLocaleDateString('uz-UZ')}\n\n`;
      });
      return text;
    },
    
    couriersTitle: '👨‍✈️ KURERLAR',
    
    noCouriers: 'Hozircha kurerlar yo\'q.',
    
    couriersList: (couriers) => {
      let text = '👨‍✈️ Kurerlar ro\'yxati:\n\n';
      couriers.forEach((courier, index) => {
        text += `${index + 1}. 🆔 ${courier.telegramId}\n`;
        text += `   📦 Yetkazilgan: ${courier.totalDeliveries || 0}\n`;
        text += `   📅 Bugun: ${courier.todayDeliveries || 0}\n`;
        text += `   ${courier.isActive ? '✅ Faol' : '❌ Nofaol'}\n\n`;
      });
      return text;
    },
    
    addCourierPrompt: 'Yangi kurer Telegram ID sini yuboring:',
    
    courierAdded: (telegramId) => `✅ Kurer qo'shildi!\nTelegram ID: ${telegramId}`,
    
    courierRemoved: '❌ Kurer o\'chirildi.',
    
    statistics: (stats) => {
      return `📊 STATISTIKA\n\n` +
        `📅 Bugun:\n` +
        `   📦 Buyurtmalar: ${stats.todayOrders || 0}\n` +
        `   ✅ Yetkazilgan: ${stats.deliveredToday || 0}\n\n` +
        `📈 Umumiy:\n` +
        `   📦 Jami buyurtmalar: ${stats.totalOrders || 0}\n` +
        `   ✅ Jami yetkazilgan: ${stats.deliveredTotal || 0}`;
    },
    
    settingsMenu: '⚙️ SOZLAMALAR\n\nHozircha sozlamalar bo\'limi ishlab chiqilmoqda.',
    
    invalidCourierId: '❌ Noto\'g\'ri Telegram ID. Iltimos, faqat raqamlarni kiriting.'
  },

  // Common messages
  common: {
    unknownCommand: '❓ Noma\'lum buyruq. Iltimos, /start buyrug\'ini yuboring.',
    backToMainMenu: '🏠 Bosh menyuga qaytdingiz.'
  }
};

module.exports = messages;
