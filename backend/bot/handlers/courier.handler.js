const messages = require('../messages/uzbek.messages');
const keyboards = require('../keyboards/courier.keyboards');
const sessionManager = require('../middleware/sessionManager');
const { requireRole } = require('../middleware/roleCheck');

const Order = require('../../models/Order');
const User = require('../../models/User');
const Courier = require('../../models/Courier');

function setupCourierHandlers(bot) {
  bot.onText(/📦 Mavjud buyurtmalar/, async (msg) => {
    const user = await requireRole(bot, msg, 'courier');
    if (!user) return;
    
    await handleAvailableOrders(bot, msg, user);
  });
  
  bot.onText(/📊 Statistikam/, async (msg) => {
    const user = await requireRole(bot, msg, 'courier');
    if (!user) return;
    
    await handleCourierStatistics(bot, msg, user);
  });
  
  bot.on('callback_query', async (query) => {
    const data = query.data;
    const telegramId = query.from.id.toString();
    
    try {
      if (data.startsWith('courier_view_order:')) {
        await handleViewAvailableOrder(bot, query, telegramId);
      } else if (data.startsWith('courier_accept:')) {
        await handleAcceptDelivery(bot, query, telegramId);
      } else if (data.startsWith('courier_pickup:')) {
        await handleRequestPickupConfirm(bot, query, telegramId);
      } else if (data.startsWith('confirm_pickup:')) {
        await handleConfirmPickup(bot, query, telegramId);
      } else if (data.startsWith('courier_share_location:')) {
        await handleShareLocationRequest(bot, query, telegramId);
      } else if (data.startsWith('courier_deliver:')) {
        await handleRequestDeliveryConfirm(bot, query, telegramId);
      } else if (data.startsWith('confirm_delivery:')) {
        await handleConfirmDelivery(bot, query, telegramId);
      } else if (data === 'courier_available_orders') {
        await handleAvailableOrdersCallback(bot, query, telegramId);
      } else if (data === 'courier_refresh_orders') {
        await handleRefreshOrders(bot, query, telegramId);
      } else if (data.startsWith('courier_my_order:')) {
        await handleViewMyOrder(bot, query, telegramId);
      } else if (data.startsWith('view_address:')) {
        await handleViewAddress(bot, query, telegramId);
      } else if (data.startsWith('view_route:')) {
        await handleViewRoute(bot, query, telegramId);
      } else if (data.startsWith('courier_stats:')) {
        await handleStatsPeriod(bot, query, telegramId);
      } else if (data === 'courier_main') {
        await bot.sendMessage(query.message.chat.id, messages.courierMainMenu, keyboards.mainMenu());
        await bot.answerCallbackQuery(query.id);
      }
    } catch (error) {
      console.error('Courier callback error:', error);
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
    }
  });
  
  bot.on('location', async (msg) => {
    if (msg.location) {
      await handleLocationUpdate(bot, msg);
    }
  });
}

async function handleAvailableOrders(bot, msg, user) {
  try {
    const orders = await Order.find({
      status: 'ready',
      courier: null
    })
    .populate('vendor', 'name address')
    .sort({ createdAt: 1 })
    .limit(20);
    
    if (!orders || orders.length === 0) {
      await bot.sendMessage(msg.chat.id, messages.noAvailableOrders, keyboards.mainMenu());
      return;
    }
    
    await bot.sendMessage(
      msg.chat.id,
      messages.availableOrders(orders.length),
      keyboards.availableOrders(orders)
    );
  } catch (error) {
    console.error('Available orders error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleAvailableOrdersCallback(bot, query, telegramId) {
  try {
    const orders = await Order.find({
      status: 'ready',
      courier: null
    })
    .populate('vendor', 'name address')
    .sort({ createdAt: 1 })
    .limit(20);
    
    await bot.editMessageText(
      messages.availableOrders(orders.length),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.availableOrders(orders).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Available orders callback error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleRefreshOrders(bot, query, telegramId) {
  await handleAvailableOrdersCallback(bot, query, telegramId);
}

async function handleViewAvailableOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('vendor', 'name address contact')
      .populate('customer', 'firstName phone');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    let orderText = `📦 Buyurtma #${order.orderNumber}\n\n`;
    orderText += `🏪 Do'kon: ${order.vendor.name}\n`;
    orderText += `📍 Do'kon manzili: ${order.vendor.address.street}\n\n`;
    orderText += `🏠 Yetkazish manzili: ${order.deliveryAddress.street}\n`;
    orderText += `💰 Yetkazib berish: ${order.pricing.deliveryFee} so'm\n`;
    orderText += `💵 Jami: ${order.pricing.total} so'm\n`;
    
    if (order.notes?.customer) {
      orderText += `\n📝 Izoh: ${order.notes.customer}`;
    }
    
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
    console.error('View available order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAcceptDelivery(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const user = await User.findByTelegramId(telegramId);
    
    const activeOrder = await Order.findOne({
      courier: user._id,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] }
    });
    
    if (activeOrder) {
      await bot.answerCallbackQuery(query.id, { 
        text: 'Sizda faol buyurtma bor. Avval uni yetkazib bering.' 
      });
      return;
    }
    
    const order = await Order.findById(orderId)
      .populate('vendor', 'name address')
      .populate('customer', 'firstName telegramId');
    
    if (!order || order.status !== 'ready') {
      await bot.answerCallbackQuery(query.id, { 
        text: 'Buyurtma topilmadi yoki band qilingan' 
      });
      return;
    }
    
    order.courier = user._id;
    order.status = 'assigned';
    await order.save();
    
    await bot.editMessageText(
      messages.orderAssignedToCourierSelf(order),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.orderActions(orderId, 'assigned').reply_markup
      }
    );
    
    if (order.customer.telegramId) {
      try {
        await bot.sendMessage(
          order.customer.telegramId,
          messages.orderAssignedToCourier(order.orderNumber, user.firstName)
        );
      } catch (err) {
        console.error('Failed to notify customer:', err);
      }
    }
    
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma qabul qilindi!' });
  } catch (error) {
    console.error('Accept delivery error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleRequestPickupConfirm(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    await bot.editMessageReplyMarkup(
      keyboards.confirmPickup(orderId).reply_markup,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Request pickup confirm error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleConfirmPickup(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('customer', 'telegramId');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    order.status = 'picked_up';
    await order.save();
    
    const customerAddress = `${order.deliveryAddress.street}${order.deliveryAddress.apartment ? ', кв. ' + order.deliveryAddress.apartment : ''}`;
    
    await bot.editMessageText(
      messages.orderPickedUpByCourier(order.orderNumber, customerAddress),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.orderActions(orderId, 'picked_up').reply_markup
      }
    );
    
    if (order.customer.telegramId) {
      try {
        await bot.sendMessage(
          order.customer.telegramId,
          messages.orderPickedUp(order.orderNumber)
        );
      } catch (err) {
        console.error('Failed to notify customer:', err);
      }
    }
    
    await bot.answerCallbackQuery(query.id, { text: 'Olindi!' });
  } catch (error) {
    console.error('Confirm pickup error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleShareLocationRequest(bot, query, telegramId) {
  try {
    await bot.sendMessage(
      query.message.chat.id,
      messages.requestLocation,
      keyboards.shareLocation()
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Share location request error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleLocationUpdate(bot, msg) {
  const telegramId = msg.from.id.toString();
  
  try {
    const user = await User.findByTelegramId(telegramId);
    
    if (user.role !== 'courier') {
      return;
    }
    
    const activeOrder = await Order.findOne({
      courier: user._id,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] }
    });
    
    if (!activeOrder) {
      return;
    }
    
    user.address = user.address || {};
    user.address.location = {
      type: 'Point',
      coordinates: [msg.location.longitude, msg.location.latitude]
    };
    await user.save();
    
    if (activeOrder.status === 'picked_up') {
      activeOrder.status = 'in_transit';
      await activeOrder.save();
    }
    
    await bot.sendMessage(
      msg.chat.id,
      '✅ Lokatsiya yangilandi!',
      { reply_markup: { remove_keyboard: true } }
    );
  } catch (error) {
    console.error('Location update error:', error);
  }
}

async function handleRequestDeliveryConfirm(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    await bot.editMessageReplyMarkup(
      keyboards.confirmDelivery(orderId).reply_markup,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Request delivery confirm error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleConfirmDelivery(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('customer', 'telegramId')
      .populate('courier', 'firstName');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    order.status = 'delivered';
    order.actualDeliveryTime = new Date();
    await order.save();
    
    const earnings = order.pricing.deliveryFee;
    
    await bot.editMessageText(
      messages.orderDeliveredByCourier(order.orderNumber, earnings),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    if (order.customer.telegramId) {
      try {
        await bot.sendMessage(
          order.customer.telegramId,
          messages.orderDelivered(order.orderNumber)
        );
      } catch (err) {
        console.error('Failed to notify customer:', err);
      }
    }
    
    await bot.answerCallbackQuery(query.id, { text: 'Yetkazib berildi!' });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewMyOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('vendor', 'name address')
      .populate('customer', 'firstName phone');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    let orderText = `📦 Buyurtma #${order.orderNumber}\n\n`;
    orderText += `Holati: ${messages.getStatusText(order.status)}\n`;
    orderText += `🏪 Do'kon: ${order.vendor.name}\n`;
    orderText += `🏠 Manzil: ${order.deliveryAddress.street}\n`;
    orderText += `💰 Yetkazib berish: ${order.pricing.deliveryFee} so'm`;
    
    await bot.editMessageText(
      orderText,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.activeOrderActions(orderId).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View my order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewAddress(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('customer', 'firstName phone');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    let addressText = `📍 Yetkazish manzili\n\n`;
    addressText += `${order.deliveryAddress.street}\n`;
    
    if (order.deliveryAddress.apartment) {
      addressText += `Kvartira: ${order.deliveryAddress.apartment}\n`;
    }
    
    if (order.deliveryAddress.entrance) {
      addressText += `Podyezd: ${order.deliveryAddress.entrance}\n`;
    }
    
    if (order.deliveryAddress.floor) {
      addressText += `Qavat: ${order.deliveryAddress.floor}\n`;
    }
    
    addressText += `\n👤 Mijoz: ${order.customer.firstName}\n`;
    addressText += `📞 Telefon: ${order.customer.phone}`;
    
    if (order.deliveryAddress.instructions) {
      addressText += `\n\n📝 Ko'rsatma: ${order.deliveryAddress.instructions}`;
    }
    
    await bot.sendMessage(query.message.chat.id, addressText);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View address error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewRoute(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('vendor', 'name address');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    await bot.sendMessage(
      query.message.chat.id,
      '🗺️ Yo\'nalish',
      keyboards.orderDirections(order)
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View route error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleCourierStatistics(bot, msg, user) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDeliveries = await Order.countDocuments({
      courier: user._id,
      status: 'delivered',
      actualDeliveryTime: { $gte: today }
    });
    
    const todayEarnings = await Order.aggregate([
      {
        $match: {
          courier: user._id,
          status: 'delivered',
          actualDeliveryTime: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.deliveryFee' }
        }
      }
    ]);
    
    const totalDeliveries = await Order.countDocuments({
      courier: user._id,
      status: 'delivered'
    });
    
    const totalEarnings = await Order.aggregate([
      {
        $match: {
          courier: user._id,
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
    
    const stats = {
      todayDeliveries,
      todayEarnings: todayEarnings[0]?.total || 0,
      totalDeliveries,
      totalEarnings: totalEarnings[0]?.total || 0
    };
    
    await bot.sendMessage(
      msg.chat.id,
      messages.courierStats(stats),
      keyboards.statisticsMenu()
    );
  } catch (error) {
    console.error('Courier statistics error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleStatsPeriod(bot, query, telegramId) {
  const period = query.data.split(':')[1];
  
  try {
    const user = await User.findByTelegramId(telegramId);
    
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
    
    const deliveries = await Order.countDocuments({
      courier: user._id,
      status: 'delivered',
      actualDeliveryTime: { $gte: startDate }
    });
    
    const earnings = await Order.aggregate([
      {
        $match: {
          courier: user._id,
          status: 'delivered',
          actualDeliveryTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.deliveryFee' }
        }
      }
    ]);
    
    let periodText = '';
    if (period === 'today') periodText = 'Bugun';
    else if (period === 'week') periodText = 'Hafta';
    else if (period === 'month') periodText = 'Oy';
    else periodText = 'Jami';
    
    const statsText = `📊 Statistika (${periodText})\n\n📦 Yetkazilgan: ${deliveries}\n💰 Daromad: ${earnings[0]?.total || 0} so'm`;
    
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

module.exports = { setupCourierHandlers };
