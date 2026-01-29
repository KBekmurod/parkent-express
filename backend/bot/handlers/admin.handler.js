const messages = require('../messages/uzbek.messages');
const keyboards = require('../keyboards/admin.keyboards');
const sessionManager = require('../middleware/sessionManager');
const { requireRole } = require('../middleware/roleCheck');

const Order = require('../../models/Order');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');

function setupAdminHandlers(bot) {
  bot.onText(/📦 Buyurtmalar/, async (msg) => {
    const user = await requireRole(bot, msg, 'admin');
    if (!user) return;
    
    await handleAdminOrders(bot, msg, user);
  });
  
  bot.onText(/🏪 Do'konlar/, async (msg) => {
    const user = await requireRole(bot, msg, 'admin');
    if (!user) return;
    
    await handleAdminVendors(bot, msg, user);
  });
  
  bot.onText(/🚴 Kurerlar/, async (msg) => {
    const user = await requireRole(bot, msg, 'admin');
    if (!user) return;
    
    await handleAdminCouriers(bot, msg, user);
  });
  
  bot.onText(/👥 Foydalanuvchilar/, async (msg) => {
    const user = await requireRole(bot, msg, 'admin');
    if (!user) return;
    
    await handleAdminUsers(bot, msg, user);
  });
  
  bot.onText(/📊 Statistika/, async (msg) => {
    const user = await requireRole(bot, msg, 'admin');
    if (!user) return;
    
    await handleAdminStatistics(bot, msg, user);
  });
  
  bot.on('callback_query', async (query) => {
    const data = query.data;
    const telegramId = query.from.id.toString();
    
    try {
      if (data.startsWith('admin_orders:')) {
        await handleOrdersFilterAdmin(bot, query, telegramId);
      } else if (data === 'admin_order_filters') {
        await handleShowOrderFilters(bot, query, telegramId);
      } else if (data.startsWith('admin_order:')) {
        await handleViewAdminOrder(bot, query, telegramId);
      } else if (data.startsWith('admin_order_details:')) {
        await handleOrderDetails(bot, query, telegramId);
      } else if (data.startsWith('admin_assign_courier:')) {
        await handleShowAvailableCouriers(bot, query, telegramId);
      } else if (data.startsWith('assign_courier:')) {
        await handleAssignCourier(bot, query, telegramId);
      } else if (data.startsWith('admin_cancel_order:')) {
        await handleCancelOrderAdmin(bot, query, telegramId);
      } else if (data === 'admin_vendors') {
        await handleAdminVendorsCallback(bot, query, telegramId);
      } else if (data.startsWith('admin_vendor:')) {
        await handleViewVendor(bot, query, telegramId);
      } else if (data.startsWith('admin_toggle_vendor:')) {
        await handleToggleVendor(bot, query, telegramId);
      } else if (data === 'admin_add_vendor') {
        await handleAddVendor(bot, query, telegramId);
      } else if (data === 'admin_couriers') {
        await handleAdminCouriersCallback(bot, query, telegramId);
      } else if (data.startsWith('admin_courier:')) {
        await handleViewCourier(bot, query, telegramId);
      } else if (data.startsWith('admin_toggle_courier:')) {
        await handleToggleCourier(bot, query, telegramId);
      } else if (data === 'admin_add_courier') {
        await handleAddCourier(bot, query, telegramId);
      } else if (data.startsWith('admin_courier_stats:')) {
        await handleCourierStats(bot, query, telegramId);
      } else if (data.startsWith('admin_stats:')) {
        await handleStatsPeriod(bot, query, telegramId);
      } else if (data.startsWith('admin_users:')) {
        await handleUsersFilter(bot, query, telegramId);
      } else if (data.startsWith('admin_user:')) {
        await handleViewUser(bot, query, telegramId);
      } else if (data.startsWith('admin_confirm:')) {
        await handleConfirmAction(bot, query, telegramId);
      } else if (data === 'admin_main') {
        await bot.sendMessage(query.message.chat.id, messages.adminMainMenu, keyboards.mainMenu());
        await bot.answerCallbackQuery(query.id);
      }
    } catch (error) {
      console.error('Admin callback error:', error);
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
    }
  });
  
  bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/') && !['📦 Buyurtmalar', '🏪 Do\'konlar', '🚴 Kurerlar', '👥 Foydalanuvchilar', '📊 Statistika'].includes(msg.text)) {
      await handleAdminTextInput(bot, msg);
    }
  });
}

async function handleAdminOrders(bot, msg, user) {
  try {
    const total = await Order.countDocuments();
    const active = await Order.countDocuments({
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit'] }
    });
    const completed = await Order.countDocuments({ status: 'delivered' });
    
    await bot.sendMessage(
      msg.chat.id,
      messages.adminOrders(total, active, completed),
      keyboards.orderFilters()
    );
  } catch (error) {
    console.error('Admin orders error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleShowOrderFilters(bot, query, telegramId) {
  try {
    const total = await Order.countDocuments();
    const active = await Order.countDocuments({
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit'] }
    });
    const completed = await Order.countDocuments({ status: 'delivered' });
    
    await bot.editMessageText(
      messages.adminOrders(total, active, completed),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.orderFilters().reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Show order filters error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleOrdersFilterAdmin(bot, query, telegramId) {
  const filter = query.data.split(':')[1];
  
  try {
    let statusFilter = {};
    if (filter !== 'all') {
      statusFilter = { status: filter };
    }
    
    const orders = await Order.find(statusFilter)
      .populate('vendor', 'name')
      .populate('customer', 'firstName')
      .populate('courier', 'firstName')
      .sort({ createdAt: -1 })
      .limit(30);
    
    await bot.editMessageText(
      `📦 Buyurtmalar (${orders.length})`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.ordersList(orders).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Orders filter admin error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewAdminOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('vendor', 'name')
      .populate('customer', 'firstName lastName phone')
      .populate('courier', 'firstName lastName phone');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    const orderText = messages.adminOrderDetails(order);
    
    await bot.editMessageText(
      orderText,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.orderActions(orderId, order.status).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View admin order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleOrderDetails(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('vendor', 'name address contact')
      .populate('customer', 'firstName lastName phone address')
      .populate('courier', 'firstName lastName phone');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    let detailsText = `📦 Buyurtma to'liq ma'lumotlari\n\n`;
    detailsText += `Raqami: #${order.orderNumber}\n`;
    detailsText += `Holati: ${messages.getStatusText(order.status)}\n\n`;
    
    detailsText += `👤 Mijoz:\n`;
    detailsText += `  Ismi: ${order.customer.firstName}${order.customer.lastName ? ' ' + order.customer.lastName : ''}\n`;
    detailsText += `  Telefon: ${order.customer.phone}\n\n`;
    
    detailsText += `🏪 Do'kon:\n`;
    detailsText += `  Nomi: ${order.vendor.name}\n`;
    detailsText += `  Manzil: ${order.vendor.address.street}\n`;
    detailsText += `  Telefon: ${order.vendor.contact.phone}\n\n`;
    
    if (order.courier) {
      detailsText += `🚴 Kurier:\n`;
      detailsText += `  Ismi: ${order.courier.firstName}${order.courier.lastName ? ' ' + order.courier.lastName : ''}\n`;
      detailsText += `  Telefon: ${order.courier.phone}\n\n`;
    }
    
    detailsText += `💰 To'lov:\n`;
    detailsText += `  Mahsulotlar: ${order.pricing.subtotal} so'm\n`;
    detailsText += `  Yetkazish: ${order.pricing.deliveryFee} so'm\n`;
    detailsText += `  Xizmat: ${order.pricing.serviceFee} so'm\n`;
    detailsText += `  Jami: ${order.pricing.total} so'm\n`;
    detailsText += `  Usul: ${order.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}\n\n`;
    
    detailsText += `📅 Sana: ${messages.formatDate(order.createdAt)}`;
    
    await bot.sendMessage(query.message.chat.id, detailsText);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Order details error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleShowAvailableCouriers(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const couriers = await User.find({ role: 'courier', isActive: true });
    
    await bot.editMessageReplyMarkup(
      keyboards.availableCouriers(couriers, orderId).reply_markup,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Show available couriers error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAssignCourier(bot, query, telegramId) {
  const [_, orderId, courierId] = query.data.split(':');
  
  try {
    const order = await Order.findById(orderId)
      .populate('customer', 'telegramId');
    const courier = await User.findById(courierId);
    
    if (!order || !courier) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    order.courier = courierId;
    order.status = 'assigned';
    await order.save();
    
    await bot.editMessageText(
      `✅ Kurier tayinlandi!\n\nBuyurtma #${order.orderNumber}\nKurier: ${courier.firstName}`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    if (courier.telegramId) {
      try {
        await bot.sendMessage(
          courier.telegramId,
          `🔔 Sizga yangi buyurtma tayinlandi!\n\nBuyurtma #${order.orderNumber}`
        );
      } catch (err) {
        console.error('Failed to notify courier:', err);
      }
    }
    
    if (order.customer.telegramId) {
      try {
        await bot.sendMessage(
          order.customer.telegramId,
          messages.orderAssignedToCourier(order.orderNumber, courier.firstName)
        );
      } catch (err) {
        console.error('Failed to notify customer:', err);
      }
    }
    
    await bot.answerCallbackQuery(query.id, { text: 'Kurier tayinlandi!' });
  } catch (error) {
    console.error('Assign courier error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleCancelOrderAdmin(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('customer', 'telegramId');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    order.status = 'cancelled';
    order.cancellationReason = 'Admin tomonidan bekor qilingan';
    await order.save();
    
    await bot.editMessageText(
      `❌ Buyurtma bekor qilindi\n\nBuyurtma #${order.orderNumber}`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    if (order.customer.telegramId) {
      try {
        await bot.sendMessage(
          order.customer.telegramId,
          `❌ Buyurtma #${order.orderNumber} admin tomonidan bekor qilindi.`
        );
      } catch (err) {
        console.error('Failed to notify customer:', err);
      }
    }
    
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma bekor qilindi' });
  } catch (error) {
    console.error('Cancel order admin error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAdminVendors(bot, msg, user) {
  try {
    const total = await Vendor.countDocuments();
    const active = await Vendor.countDocuments({ isActive: true });
    const inactive = total - active;
    
    const vendors = await Vendor.find().populate('owner', 'firstName').limit(30);
    
    await bot.sendMessage(
      msg.chat.id,
      messages.adminVendors(total, active, inactive),
      keyboards.vendorsList(vendors)
    );
  } catch (error) {
    console.error('Admin vendors error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleAdminVendorsCallback(bot, query, telegramId) {
  try {
    const total = await Vendor.countDocuments();
    const active = await Vendor.countDocuments({ isActive: true });
    const inactive = total - active;
    
    const vendors = await Vendor.find().populate('owner', 'firstName').limit(30);
    
    await bot.editMessageText(
      messages.adminVendors(total, active, inactive),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.vendorsList(vendors).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Admin vendors callback error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewVendor(bot, query, telegramId) {
  const vendorId = query.data.split(':')[1];
  
  try {
    const vendor = await Vendor.findById(vendorId).populate('owner', 'firstName phone');
    
    if (!vendor) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    const vendorText = messages.vendorInfo(vendor);
    
    await bot.editMessageText(
      vendorText,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.vendorActions(vendorId, vendor.isActive).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View vendor error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleToggleVendor(bot, query, telegramId) {
  const vendorId = query.data.split(':')[1];
  
  try {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    vendor.isActive = !vendor.isActive;
    await vendor.save();
    
    await bot.answerCallbackQuery(query.id, { 
      text: vendor.isActive ? '✅ Do\'kon faollashtirildi' : '❌ Do\'kon o\'chirildi' 
    });
    
    await handleViewVendor(bot, { ...query, data: `admin_vendor:${vendorId}` }, telegramId);
  } catch (error) {
    console.error('Toggle vendor error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAddVendor(bot, query, telegramId) {
  try {
    await sessionManager.setSession(telegramId, 'vendor_registration', {
      step: 'enter_name'
    });
    
    await bot.sendMessage(query.message.chat.id, messages.vendorRegistrationStart);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Add vendor error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAdminCouriers(bot, msg, user) {
  try {
    const total = await User.countDocuments({ role: 'courier' });
    const active = await User.countDocuments({ role: 'courier', isActive: true });
    
    const activeOrders = await Order.countDocuments({
      status: { $in: ['assigned', 'picked_up', 'in_transit'] }
    });
    
    const couriers = await User.find({ role: 'courier' }).limit(30);
    
    await bot.sendMessage(
      msg.chat.id,
      messages.adminCouriers(total, active, activeOrders),
      keyboards.couriersList(couriers)
    );
  } catch (error) {
    console.error('Admin couriers error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleAdminCouriersCallback(bot, query, telegramId) {
  try {
    const total = await User.countDocuments({ role: 'courier' });
    const active = await User.countDocuments({ role: 'courier', isActive: true });
    
    const activeOrders = await Order.countDocuments({
      status: { $in: ['assigned', 'picked_up', 'in_transit'] }
    });
    
    const couriers = await User.find({ role: 'courier' }).limit(30);
    
    await bot.editMessageText(
      messages.adminCouriers(total, active, activeOrders),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.couriersList(couriers).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Admin couriers callback error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewCourier(bot, query, telegramId) {
  const courierId = query.data.split(':')[1];
  
  try {
    const courier = await User.findById(courierId);
    
    if (!courier) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    const courierText = messages.courierInfo(courier);
    
    await bot.editMessageText(
      courierText,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.courierActions(courierId, courier.isActive).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View courier error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleToggleCourier(bot, query, telegramId) {
  const courierId = query.data.split(':')[1];
  
  try {
    const courier = await User.findById(courierId);
    
    if (!courier) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    courier.isActive = !courier.isActive;
    await courier.save();
    
    await bot.answerCallbackQuery(query.id, { 
      text: courier.isActive ? '✅ Kurier faollashtirildi' : '❌ Kurier o\'chirildi' 
    });
    
    await handleViewCourier(bot, { ...query, data: `admin_courier:${courierId}` }, telegramId);
  } catch (error) {
    console.error('Toggle courier error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAddCourier(bot, query, telegramId) {
  try {
    await sessionManager.setSession(telegramId, 'courier_registration', {
      step: 'enter_name'
    });
    
    await bot.sendMessage(query.message.chat.id, messages.courierRegistrationStart);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Add courier error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleCourierStats(bot, query, telegramId) {
  const courierId = query.data.split(':')[1];
  
  try {
    const deliveries = await Order.countDocuments({
      courier: courierId,
      status: 'delivered'
    });
    
    const earnings = await Order.aggregate([
      {
        $match: {
          courier: require('mongoose').Types.ObjectId(courierId),
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.deliveryFee' }
        }
      }
    ]);
    
    const statsText = `📊 Kurier statistikasi\n\n📦 Jami yetkazilgan: ${deliveries}\n💰 Jami daromad: ${earnings[0]?.total || 0} so'm`;
    
    await bot.sendMessage(query.message.chat.id, statsText);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Courier stats error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAdminStatistics(bot, msg, user) {
  try {
    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const totalCouriers = await User.countDocuments({ role: 'courier' });
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: { $in: ['cancelled', 'rejected'] } });
    
    const revenue = await Order.aggregate([
      {
        $match: {
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' }
        }
      }
    ]);
    
    const stats = {
      totalUsers,
      totalVendors,
      totalCouriers,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: revenue[0]?.total || 0
    };
    
    await bot.sendMessage(
      msg.chat.id,
      messages.adminStats(stats),
      keyboards.statisticsMenu()
    );
  } catch (error) {
    console.error('Admin statistics error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleStatsPeriod(bot, query, telegramId) {
  const period = query.data.split(':')[1];
  
  try {
    let startDate = new Date();
    
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(0);
    }
    
    const orders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });
    
    const completed = await Order.countDocuments({
      status: 'delivered',
      actualDeliveryTime: { $gte: startDate }
    });
    
    const revenue = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          actualDeliveryTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' }
        }
      }
    ]);
    
    let periodText = '';
    if (period === 'today') periodText = 'Bugun';
    else if (period === 'week') periodText = 'Hafta';
    else if (period === 'month') periodText = 'Oy';
    else periodText = 'Jami';
    
    const statsText = `📊 Tizim statistikasi (${periodText})\n\n📦 Buyurtmalar: ${orders}\n✅ Bajarilgan: ${completed}\n💰 Daromad: ${revenue[0]?.total || 0} so'm`;
    
    await bot.editMessageText(
      statsText,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.statisticsMenu().reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Stats period error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAdminUsers(bot, msg, user) {
  try {
    const users = await User.find().limit(30);
    
    await bot.sendMessage(
      msg.chat.id,
      `👥 Foydalanuvchilar (${users.length})`,
      keyboards.usersList(users, 'all')
    );
  } catch (error) {
    console.error('Admin users error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleUsersFilter(bot, query, telegramId) {
  const role = query.data.split(':')[1];
  
  try {
    let filter = {};
    if (role !== 'all') {
      filter = { role };
    }
    
    const users = await User.find(filter).limit(30);
    
    await bot.editMessageText(
      `👥 Foydalanuvchilar (${users.length})`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.usersList(users, role).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Users filter error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewUser(bot, query, telegramId) {
  const userId = query.data.split(':')[1];
  
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    let userText = `👤 ${user.firstName}${user.lastName ? ' ' + user.lastName : ''}\n\n`;
    userText += `Rol: ${messages.getRoleText(user.role)}\n`;
    userText += `Telefon: ${user.phone}\n`;
    userText += `Holati: ${user.isActive ? '✅ Faol' : '❌ Nofaol'}\n`;
    userText += `Til: ${user.language}\n`;
    userText += `Ro'yxatdan o'tgan: ${messages.formatDate(user.createdAt)}`;
    
    await bot.sendMessage(query.message.chat.id, userText);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View user error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleConfirmAction(bot, query, telegramId) {
  const [_, action, targetId] = query.data.split(':');
  
  await bot.answerCallbackQuery(query.id, { text: 'Amalga oshirildi' });
}

async function handleAdminTextInput(bot, msg) {
  const telegramId = msg.from.id.toString();
  
  try {
    const session = await sessionManager.getSession(telegramId);
    
    if (!session) {
      return;
    }
  } catch (error) {
    console.error('Admin text input error:', error);
  }
}

module.exports = { setupAdminHandlers };
