const uzbekMessages = {
  // Welcome & Navigation (5 messages)
  welcome: (name) => `Assalomu alaykum, ${name}! 👋\n\nParkent Express xizmatiga xush kelibsiz.\nTez va qulay yetkazib berish xizmati!`,
  
  welcomeCustomer: (name) => `Salom, ${name}! 🛍️\n\nSiz mijoz sifatida ro'yxatdan o'tgansiz.\nEndi buyurtma berishingiz mumkin!`,
  
  welcomeVendor: (name) => `Salom, ${name}! 🏪\n\nSiz do'kon egasi sifatida tizimga kirgansiz.\nYangi buyurtmalarni qabul qilishingiz mumkin.`,
  
  welcomeCourier: (name) => `Salom, ${name}! 🚴\n\nSiz kurier sifatida tizimga kirgansiz.\nYetkazib berish uchun tayyor buyurtmalar mavjud.`,
  
  welcomeAdmin: (name) => `Salom, ${name}! 👨‍💼\n\nAdmin paneliga xush kelibsiz.\nTizimni boshqarishingiz mumkin.`,
  
  // Customer Messages (15 messages)
  customerMainMenu: `🏠 Asosiy menyu\n\nQuyidagi bo'limlardan birini tanlang:`,
  
  selectVendor: `🏪 Do'kon tanlash\n\nQaysi do'kondan buyurtma bermoqchisiz?`,
  
  noVendorsAvailable: `❌ Hozirda ochiq do'konlar yo'q.\n\nKeyinroq qayta urinib ko'ring.`,
  
  sendLocation: `📍 Joylashuvingizni yuboring\n\nYetkazib berish manzilini aniqlash uchun lokatsiyangizni yuboring yoki manzilni yozing.`,
  
  locationNotInParkent: `❌ Kechirasiz, hozircha faqat Parkent shahri ichida xizmat ko'rsatamiz.\n\nIltimos, Parkent hududidan joylashuv yuboring.`,
  
  enterOrderDetails: (vendorName) => `📝 Buyurtma tafsilotlari\n\nDo'kon: ${vendorName}\n\nNima buyurtma qilmoqchisiz? Mahsulot nomi va miqdorini kiriting.\n\nMisol:\n• Osh 2ta\n• Lag'mon 1ta\n• Salat 3ta`,
  
  selectPaymentMethod: `💳 To'lov usulini tanlang\n\nQanday to'lov qilmoqchisiz?`,
  
  orderConfirmation: (orderSummary) => `✅ Buyurtmangizni tasdiqlang\n\n${orderSummary}\n\nBuyurtmani tasdiqlaysizmi?`,
  
  orderCreated: (orderNumber) => `🎉 Buyurtma qabul qilindi!\n\nBuyurtma raqami: #${orderNumber}\n\nDo'kon buyurtmani ko'rib chiqmoqda. Tez orada javob beramiz.`,
  
  orderCancelled: `❌ Buyurtma bekor qilindi.\n\nAsosiy menyuga qaytdingiz.`,
  
  myOrders: (count) => `📦 Mening buyurtmalarim (${count})\n\nBuyurtmalardan birini tanlang:`,
  
  noOrders: `📦 Sizda hali buyurtmalar yo'q.\n\nBirinchi buyurtmangizni bering!`,
  
  orderDetails: (order) => `📦 Buyurtma #${order.orderNumber}\n\nHolati: ${getStatusText(order.status)}\nDo'kon: ${order.vendor?.name || 'Noma\'lum'}\nJami: ${order.pricing.total} so'm\nSana: ${formatDate(order.createdAt)}\n\n${order.notes?.customer || ''}`,
  
  trackOrder: (order, courierLocation) => {
    let text = `📍 Buyurtma kuzatuvi #${order.orderNumber}\n\n`;
    text += `Holati: ${getStatusText(order.status)}\n`;
    
    if (order.courier) {
      text += `\n🚴 Kurier: ${order.courier.firstName}\n`;
      if (courierLocation) {
        text += `Joriy joylashuv: ${courierLocation.address || 'Aniqlanmoqda...'}\n`;
      }
    }
    
    if (order.estimatedDeliveryTime) {
      text += `\n⏰ Taxminiy yetkazib berish: ${formatTime(order.estimatedDeliveryTime)}`;
    }
    
    return text;
  },
  
  helpMessage: `❓ Yordam\n\n📱 Qo'llab-quvvatlash: +998 XX XXX XX XX\n📧 Email: support@parkent-express.uz\n\n🕒 Ish vaqti: 08:00 - 22:00\n\nSavollaringiz bo'lsa, biz bilan bog'laning!`,
  
  // Order Creation Flow (10 messages)
  orderCreationStep1: `1️⃣ Qadam 1/4: Do'kon tanlash\n\nQuyidagi do'konlardan birini tanlang:`,
  
  orderCreationStep2: (vendorName) => `2️⃣ Qadam 2/4: Joylashuv\n\nDo'kon: ${vendorName}\n\nYetkazib berish manzilini yuboring.`,
  
  orderCreationStep3: (vendorName) => `3️⃣ Qadam 3/4: Buyurtma tafsilotlari\n\nDo'kon: ${vendorName}\n\nNima buyurtma qilmoqchisiz?`,
  
  orderCreationStep4: `4️⃣ Qadam 4/4: To'lov usuli\n\nTo'lov usulini tanlang:`,
  
  orderEditingField: (field) => `✏️ ${field} o'zgartirish\n\nYangi qiymatni kiriting:`,
  
  orderSaved: `💾 O'zgarishlar saqlandi!\n\nBuyurtmangizni yana bir bor ko'rib chiqing.`,
  
  // Order Status Messages (7 messages)
  orderConfirmedByVendor: (orderNumber, preparationTime) => `✅ Buyurtma tasdiqlandi!\n\nBuyurtma #${orderNumber} do'kon tomonidan qabul qilindi.\n\n⏰ Tayyorlanish vaqti: ${preparationTime} daqiqa`,
  
  orderRejectedByVendor: (orderNumber, reason) => `❌ Buyurtma rad etildi\n\nBuyurtma #${orderNumber}\n\nSabab: ${reason || 'Ko\'rsatilmagan'}\n\nPulingiz qaytariladi.`,
  
  orderPreparing: (orderNumber) => `👨‍🍳 Buyurtma tayyorlanmoqda\n\nBuyurtma #${orderNumber} hozir tayyorlanmoqda.\n\nTez orada tayyor bo'ladi!`,
  
  orderReady: (orderNumber) => `✅ Buyurtma tayyor!\n\nBuyurtma #${orderNumber} tayyor.\n\nKurier tez orada oladi.`,
  
  orderAssignedToCourier: (orderNumber, courierName) => `🚴 Kurier tayinlandi\n\nBuyurtma #${orderNumber}\nKurier: ${courierName}\n\nKurier do'kondan buyurtmani olish yo'lida.`,
  
  orderPickedUp: (orderNumber) => `📦 Buyurtma olib ketildi\n\nBuyurtma #${orderNumber} kurier tomonidan olingan.\n\nSizga yetkazib berilmoqda...`,
  
  orderDelivered: (orderNumber) => `🎉 Yetkazib berildi!\n\nBuyurtma #${orderNumber} muvaffaqiyatli yetkazib berildi.\n\n⭐ Xizmatimizni baholang!`,
  
  // Vendor Messages (10 messages)
  vendorMainMenu: `🏪 Do'kon boshqaruvi\n\nQuyidagi bo'limlardan birini tanlang:`,
  
  newOrderNotification: (order) => `🔔 Yangi buyurtma!\n\nBuyurtma #${order.orderNumber}\nMijoz: ${order.customer.firstName}\nJami: ${order.pricing.total} so'm\n\n${order.notes?.customer || 'Izoh yo\'q'}`,
  
  orderAccepted: (orderNumber) => `✅ Buyurtma qabul qilindi\n\nBuyurtma #${orderNumber} tayyorlashni boshlang.\n\nMijoz xabardor qilindi.`,
  
  orderRejected: (orderNumber) => `❌ Buyurtma rad etildi\n\nBuyurtma #${orderNumber} rad etildi.\n\nMijoz xabardor qilindi.`,
  
  enterRejectionReason: `❓ Rad etish sababini kiriting\n\nMijozga ko'rsatiladi:`,
  
  enterPreparationTime: `⏰ Tayyorlanish vaqtini kiriting\n\nNecha daqiqada tayyor bo'ladi? (raqam kiriting)`,
  
  orderMarkedPreparing: (orderNumber) => `👨‍🍳 Tayyorlanish boshlandi\n\nBuyurtma #${orderNumber}\n\nMijoz xabardor qilindi.`,
  
  orderMarkedReady: (orderNumber) => `✅ Buyurtma tayyor!\n\nBuyurtma #${orderNumber}\n\nKurier tez orada tayinlanadi.`,
  
  vendorOrders: (pending, preparing, ready) => `📊 Buyurtmalar\n\n⏳ Kutilmoqda: ${pending}\n👨‍🍳 Tayyorlanmoqda: ${preparing}\n✅ Tayyor: ${ready}\n\nBuyurtmani tanlang:`,
  
  vendorStats: (stats) => `📊 Statistika\n\n📦 Bugungi buyurtmalar: ${stats.todayOrders}\n💰 Bugungi daromad: ${stats.todayRevenue} so'm\n\n📈 Jami buyurtmalar: ${stats.totalOrders}\n💵 Jami daromad: ${stats.totalRevenue} so'm`,
  
  // Courier Messages (10 messages)
  courierMainMenu: `🚴 Kurier paneli\n\nQuyidagi bo'limlardan birini tanlang:`,
  
  availableOrders: (count) => `📦 Mavjud buyurtmalar (${count})\n\nYetkazib berish uchun tayyor buyurtmalarni tanlang:`,
  
  noAvailableOrders: `📦 Hozirda mavjud buyurtmalar yo'q.\n\nYangi buyurtmalar paydo bo'lganda xabardor qilamiz.`,
  
  orderAssignedToCourierSelf: (order) => `✅ Buyurtma qabul qilindi!\n\nBuyurtma #${order.orderNumber}\nDo'kon: ${order.vendor.name}\nManzil: ${order.deliveryAddress.street}\n\nDo'kondan olib keting!`,
  
  confirmPickup: (orderNumber) => `📦 Buyurtmani oldingizmi?\n\nBuyurtma #${orderNumber}\n\nTasdiqlaysizmi?`,
  
  orderPickedUpByCourier: (orderNumber, customerAddress) => `✅ Olindi!\n\nBuyurtma #${orderNumber}\n\nMijoz manzili:\n${customerAddress}\n\nYo'lda ehtiyot bo'ling!`,
  
  requestLocation: `📍 Lokatsiyangizni ulashing\n\nMijoz sizning joylashuvingizni ko'rishi uchun lokatsiyangizni jonli ulashing.`,
  
  confirmDelivery: (orderNumber) => `✅ Yetkazib berdingizmi?\n\nBuyurtma #${orderNumber}\n\nTasdiqlaysizmi?`,
  
  orderDeliveredByCourier: (orderNumber, earnings) => `🎉 Yetkazib berildi!\n\nBuyurtma #${orderNumber}\n💰 Daromad: ${earnings} so'm\n\nMijoz xabardor qilindi.`,
  
  courierStats: (stats) => `📊 Statistika\n\n📦 Bugungi yetkazilgan: ${stats.todayDeliveries}\n💰 Bugungi daromad: ${stats.todayEarnings} so'm\n\n📈 Jami yetkazilgan: ${stats.totalDeliveries}\n💵 Jami daromad: ${stats.totalEarnings} so'm`,
  
  // Admin Messages (10 messages)
  adminMainMenu: `👨‍💼 Admin paneli\n\nTizimni boshqarish:`,
  
  adminOrders: (total, active, completed) => `📊 Buyurtmalar\n\nJami: ${total}\nFaol: ${active}\nBajarilgan: ${completed}\n\nFiltr tanlang:`,
  
  adminOrderDetails: (order) => {
    let text = `📦 Buyurtma #${order.orderNumber}\n\n`;
    text += `Holati: ${getStatusText(order.status)}\n`;
    text += `Mijoz: ${order.customer.firstName} (${order.customer.phone})\n`;
    text += `Do'kon: ${order.vendor.name}\n`;
    if (order.courier) {
      text += `Kurier: ${order.courier.firstName}\n`;
    }
    text += `\nJami: ${order.pricing.total} so'm\n`;
    text += `Sana: ${formatDate(order.createdAt)}`;
    return text;
  },
  
  adminVendors: (total, active, inactive) => `🏪 Do'konlar\n\nJami: ${total}\nFaol: ${active}\nNoFaol: ${inactive}\n\nDo'kon tanlang:`,
  
  adminCouriers: (total, active, busy) => `🚴 Kurerlar\n\nJami: ${total}\nFaol: ${active}\nBand: ${busy}\n\nKurier tanlang:`,
  
  adminStats: (stats) => `📊 Tizim statistikasi\n\n👥 Foydalanuvchilar: ${stats.totalUsers}\n🏪 Do'konlar: ${stats.totalVendors}\n🚴 Kurerlar: ${stats.totalCouriers}\n\n📦 Jami buyurtmalar: ${stats.totalOrders}\n✅ Bajarilgan: ${stats.completedOrders}\n❌ Bekor qilingan: ${stats.cancelledOrders}\n\n💰 Jami daromad: ${stats.totalRevenue} so'm`,
  
  vendorRegistrationStart: `➕ Yangi do'kon qo'shish\n\nDo'kon nomini kiriting:`,
  
  courierRegistrationStart: `➕ Yangi kurier qo'shish\n\nKurier ismini kiriting:`,
  
  registrationCompleted: (role, name) => `✅ Ro'yxatdan o'tkazildi!\n\n${role === 'vendor' ? '🏪 Do\'kon' : '🚴 Kurier'}: ${name}\n\nMuvaffaqiyatli qo'shildi.`,
  
  confirmAction: (action) => `❓ Tasdiqlash\n\n${action}\n\nDavom etasizmi?`,
  
  // Error Messages (5 messages)
  errorOccurred: `❌ Xatolik yuz berdi\n\nIltimos, qaytadan urinib ko'ring yoki qo'llab-quvvatlashga murojaat qiling.`,
  
  unauthorizedAccess: (requiredRole) => `🚫 Ruxsat yo'q\n\nBu bo'lim faqat ${getRoleText(requiredRole)} uchun.`,
  
  sessionExpired: `⏰ Sessiya tugadi\n\nIltimos, qaytadan boshlang.`,
  
  invalidInput: `❌ Noto'g'ri ma'lumot\n\nIltimos, to'g'ri formatda kiriting.`,
  
  actionCancelled: `❌ Bekor qilindi\n\nAsosiy menyuga qaytdingiz.`,
  
  // Common actions
  backToMainMenu: `🔙 Asosiy menyuga qaytish`,
  cancel: `❌ Bekor qilish`,
  confirm: `✅ Tasdiqlash`,
  edit: `✏️ Tahrirlash`,
  back: `◀️ Orqaga`,
  next: `▶️ Keyingisi`,
  skip: `⏭️ O'tkazib yuborish`,
  save: `💾 Saqlash`,
  delete: `🗑️ O'chirish`,
  view: `👁️ Ko'rish`,
  accept: `✅ Qabul qilish`,
  reject: `❌ Rad etish`,
  
  // Payment methods
  paymentCash: `💵 Naqd`,
  paymentCard: `💳 Karta`,
  paymentOnline: `🌐 Online`,
  
  // Order statuses
  statusPending: `⏳ Kutilmoqda`,
  statusConfirmed: `✅ Tasdiqlangan`,
  statusPreparing: `👨‍🍳 Tayyorlanmoqda`,
  statusReady: `✅ Tayyor`,
  statusAssigned: `🚴 Kurier tayinlandi`,
  statusPickedUp: `📦 Olib ketildi`,
  statusInTransit: `🚗 Yo'lda`,
  statusDelivered: `🎉 Yetkazildi`,
  statusCancelled: `❌ Bekor qilingan`,
  statusRejected: `❌ Rad etilgan`,
};

// Helper functions
function getStatusText(status) {
  const statusMap = {
    'pending': '⏳ Kutilmoqda',
    'confirmed': '✅ Tasdiqlangan',
    'preparing': '👨‍🍳 Tayyorlanmoqda',
    'ready': '✅ Tayyor',
    'assigned': '🚴 Kurier tayinlandi',
    'picked_up': '📦 Olib ketildi',
    'in_transit': '🚗 Yo\'lda',
    'delivered': '🎉 Yetkazildi',
    'cancelled': '❌ Bekor qilingan',
    'rejected': '❌ Rad etilgan'
  };
  return statusMap[status] || status;
}

function getRoleText(role) {
  const roleMap = {
    'customer': 'mijozlar',
    'vendor': 'do\'kon egalari',
    'courier': 'kurerlar',
    'admin': 'administratorlar'
  };
  return roleMap[role] || role;
}

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function formatTime(date) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function orderSummary(order) {
  let summary = `📦 Buyurtma tafsilotlari\n\n`;
  summary += `Do'kon: ${order.vendorName}\n`;
  summary += `Manzil: ${order.address}\n\n`;
  summary += `📝 Buyurtma:\n${order.details}\n\n`;
  summary += `💳 To'lov: ${order.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}\n`;
  summary += `💰 Jami: ${order.total || 'Hisoblanadi'} so'm`;
  return summary;
}

function vendorInfo(vendor) {
  let info = `🏪 ${vendor.name}\n\n`;
  info += `📝 ${vendor.description}\n\n`;
  info += `📍 Manzil: ${vendor.address.street}\n`;
  info += `📞 Telefon: ${vendor.contact.phone}\n\n`;
  
  if (vendor.workingHours && vendor.workingHours.length > 0) {
    info += `🕒 Ish vaqti:\n`;
    const days = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
    vendor.workingHours.forEach(wh => {
      if (wh.isOpen) {
        info += `${days[wh.day]}: ${wh.open} - ${wh.close}\n`;
      }
    });
  }
  
  return info;
}

function courierInfo(courier) {
  let info = `🚴 ${courier.firstName}`;
  if (courier.lastName) {
    info += ` ${courier.lastName}`;
  }
  info += `\n\n`;
  
  if (courier.phone) {
    info += `📞 Telefon: ${courier.phone}\n`;
  }
  
  if (courier.metadata?.totalDeliveries) {
    info += `📦 Jami yetkazilgan: ${courier.metadata.totalDeliveries}\n`;
  }
  
  if (courier.metadata?.rating) {
    info += `⭐ Reyting: ${courier.metadata.rating.toFixed(1)}\n`;
  }
  
  return info;
}

function statsDisplay(stats) {
  let display = `📊 STATISTIKA\n\n`;
  
  if (stats.orders !== undefined) {
    display += `📦 Buyurtmalar: ${stats.orders}\n`;
  }
  
  if (stats.revenue !== undefined) {
    display += `💰 Daromad: ${stats.revenue} so'm\n`;
  }
  
  if (stats.deliveries !== undefined) {
    display += `🚴 Yetkazilgan: ${stats.deliveries}\n`;
  }
  
  if (stats.activeOrders !== undefined) {
    display += `⚡ Faol: ${stats.activeOrders}\n`;
  }
  
  if (stats.completedOrders !== undefined) {
    display += `✅ Bajarilgan: ${stats.completedOrders}\n`;
  }
  
  return display;
}

module.exports = {
  ...uzbekMessages,
  getStatusText,
  getRoleText,
  formatDate,
  formatTime,
  orderSummary,
  vendorInfo,
  courierInfo,
  statsDisplay
};
