const messages = require('../messages/uzbek.messages');
const keyboards = require('../keyboards/vendor.keyboards');
const sessionManager = require('../middleware/sessionManager');
const { requireRole } = require('../middleware/roleCheck');

const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Vendor = require('../../models/Vendor');
const User = require('../../models/User');

function setupVendorHandlers(bot) {
  bot.onText(/📦 Buyurtmalar/, async (msg) => {
    const user = await requireRole(bot, msg, 'vendor');
    if (!user) return;
    
    await handleVendorOrders(bot, msg, user);
  });
  
  bot.onText(/📊 Statistika/, async (msg) => {
    const user = await requireRole(bot, msg, 'vendor');
    if (!user) return;
    
    await handleVendorStatistics(bot, msg, user);
  });
  
  bot.onText(/🍽️ Mahsulotlar/, async (msg) => {
    const user = await requireRole(bot, msg, 'vendor');
    if (!user) return;
    
    await handleVendorProducts(bot, msg, user);
  });
  
  bot.on('callback_query', async (query) => {
    const data = query.data;
    const telegramId = query.from.id.toString();
    
    try {
      if (data.startsWith('vendor_accept:')) {
        await handleAcceptOrder(bot, query, telegramId);
      } else if (data.startsWith('vendor_reject:')) {
        await handleRejectOrder(bot, query, telegramId);
      } else if (data.startsWith('vendor_status:')) {
        await handleUpdateOrderStatus(bot, query, telegramId);
      } else if (data.startsWith('vendor_order:')) {
        await handleViewVendorOrder(bot, query, telegramId);
      } else if (data === 'vendor_orders') {
        await handleVendorOrdersCallback(bot, query, telegramId);
      } else if (data.startsWith('vendor_filter:')) {
        await handleOrdersFilter(bot, query, telegramId);
      } else if (data.startsWith('vendor_product:')) {
        await handleViewProduct(bot, query, telegramId);
      } else if (data === 'vendor_products') {
        await handleVendorProductsCallback(bot, query, telegramId);
      } else if (data === 'vendor_add_product') {
        await handleAddProduct(bot, query, telegramId);
      } else if (data.startsWith('toggle_product:')) {
        await handleToggleProduct(bot, query, telegramId);
      } else if (data.startsWith('accept_time:')) {
        await handleAcceptWithTime(bot, query, telegramId);
      } else if (data.startsWith('vendor_stats:')) {
        await handleStatsPeriod(bot, query, telegramId);
      } else if (data === 'vendor_main') {
        await bot.sendMessage(query.message.chat.id, messages.vendorMainMenu, keyboards.mainMenu());
        await bot.answerCallbackQuery(query.id);
      }
    } catch (error) {
      console.error('Vendor callback error:', error);
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
    }
  });
  
  bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/') && !['📦 Buyurtmalar', '📊 Statistika', '🍽️ Mahsulotlar'].includes(msg.text)) {
      await handleVendorTextInput(bot, msg);
    }
  });
}

async function handleVendorOrders(bot, msg, user) {
  try {
    const vendor = await Vendor.findOne({ owner: user._id });
    
    if (!vendor) {
      await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
      return;
    }
    
    const orders = await Order.find({ 
      vendor: vendor._id,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
    })
    .populate('customer', 'firstName phone')
    .sort({ createdAt: -1 })
    .limit(20);
    
    const pending = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    
    await bot.sendMessage(
      msg.chat.id,
      messages.vendorOrders(pending, preparing, ready),
      keyboards.ordersList(orders, 'all')
    );
  } catch (error) {
    console.error('Vendor orders error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleVendorOrdersCallback(bot, query, telegramId) {
  try {
    const user = await User.findByTelegramId(telegramId);
    const vendor = await Vendor.findOne({ owner: user._id });
    
    if (!vendor) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    const orders = await Order.find({ 
      vendor: vendor._id,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
    })
    .populate('customer', 'firstName phone')
    .sort({ createdAt: -1 })
    .limit(20);
    
    const pending = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    
    await bot.editMessageText(
      messages.vendorOrders(pending, preparing, ready),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.ordersList(orders, 'all').reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Vendor orders callback error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewVendorOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('customer', 'firstName lastName phone')
      .populate('vendor', 'name');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    let orderText = `📦 Buyurtma #${order.orderNumber}\n\n`;
    orderText += `Holati: ${messages.getStatusText(order.status)}\n`;
    orderText += `Mijoz: ${order.customer.firstName}${order.customer.lastName ? ' ' + order.customer.lastName : ''}\n`;
    orderText += `Telefon: ${order.customer.phone}\n`;
    orderText += `\nManzil: ${order.deliveryAddress.street}\n`;
    orderText += `\nTo'lov: ${order.paymentMethod === 'cash' ? '💵 Naqd' : '💳 Karta'}\n`;
    orderText += `Jami: ${order.pricing.total} so'm\n`;
    
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
    console.error('View vendor order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAcceptOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    await bot.editMessageReplyMarkup(
      keyboards.acceptOrderOptions(orderId).reply_markup,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.answerCallbackQuery(query.id, { text: 'Tayyorlanish vaqtini tanlang' });
  } catch (error) {
    console.error('Accept order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAcceptWithTime(bot, query, telegramId) {
  const [_, orderId, prepTime] = query.data.split(':');
  
  try {
    const order = await Order.findById(orderId).populate('customer', 'telegramId firstName');
    
    if (!order || order.status !== 'pending') {
      await bot.answerCallbackQuery(query.id, { text: 'Buyurtma topilmadi yoki allaqachon qabul qilingan' });
      return;
    }
    
    order.status = 'confirmed';
    order.preparationTime = parseInt(prepTime);
    order.estimatedDeliveryTime = new Date(Date.now() + parseInt(prepTime) * 60000);
    await order.save();
    
    await bot.editMessageText(
      messages.orderAccepted(order.orderNumber),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    if (order.customer.telegramId) {
      try {
        await bot.sendMessage(
          order.customer.telegramId,
          messages.orderConfirmedByVendor(order.orderNumber, prepTime)
        );
      } catch (err) {
        console.error('Failed to notify customer:', err);
      }
    }
    
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma qabul qilindi!' });
  } catch (error) {
    console.error('Accept with time error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleRejectOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    await sessionManager.setSession(telegramId, 'order_rejection', {
      orderId,
      step: 'enter_reason'
    });
    
    await bot.sendMessage(query.message.chat.id, messages.enterRejectionReason);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Reject order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleUpdateOrderStatus(bot, query, telegramId) {
  const [_, orderId, newStatus] = query.data.split(':');
  
  try {
    const order = await Order.findById(orderId).populate('customer', 'telegramId');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    if (!order.canTransitionTo(newStatus)) {
      await bot.answerCallbackQuery(query.id, { text: 'Noto\'g\'ri holat o\'tishi' });
      return;
    }
    
    order.status = newStatus;
    await order.save();
    
    let notificationMessage = '';
    if (newStatus === 'preparing') {
      notificationMessage = messages.orderPreparing(order.orderNumber);
      await bot.editMessageText(
        messages.orderMarkedPreparing(order.orderNumber),
        {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id
        }
      );
    } else if (newStatus === 'ready') {
      notificationMessage = messages.orderReady(order.orderNumber);
      await bot.editMessageText(
        messages.orderMarkedReady(order.orderNumber),
        {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id
        }
      );
    }
    
    if (order.customer.telegramId && notificationMessage) {
      try {
        await bot.sendMessage(order.customer.telegramId, notificationMessage);
      } catch (err) {
        console.error('Failed to notify customer:', err);
      }
    }
    
    await bot.answerCallbackQuery(query.id, { text: 'Holat yangilandi!' });
  } catch (error) {
    console.error('Update order status error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleOrdersFilter(bot, query, telegramId) {
  const filter = query.data.split(':')[1];
  
  try {
    const user = await User.findByTelegramId(telegramId);
    const vendor = await Vendor.findOne({ owner: user._id });
    
    if (!vendor) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    let statusFilter = {};
    if (filter !== 'all') {
      statusFilter = { status: filter };
    } else {
      statusFilter = { status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } };
    }
    
    const orders = await Order.find({ 
      vendor: vendor._id,
      ...statusFilter
    })
    .populate('customer', 'firstName phone')
    .sort({ createdAt: -1 })
    .limit(20);
    
    await bot.editMessageReplyMarkup(
      keyboards.ordersList(orders, filter).reply_markup,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Orders filter error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleVendorStatistics(bot, msg, user) {
  try {
    const vendor = await Vendor.findOne({ owner: user._id });
    
    if (!vendor) {
      await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({
      vendor: vendor._id,
      createdAt: { $gte: today }
    });
    
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          vendor: vendor._id,
          createdAt: { $gte: today },
          status: { $in: ['delivered', 'in_transit', 'picked_up'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' }
        }
      }
    ]);
    
    const totalOrders = await Order.countDocuments({ vendor: vendor._id });
    
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          vendor: vendor._id,
          status: { $in: ['delivered', 'in_transit', 'picked_up'] }
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
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    };
    
    await bot.sendMessage(
      msg.chat.id,
      messages.vendorStats(stats),
      keyboards.statisticsMenu()
    );
  } catch (error) {
    console.error('Vendor statistics error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleStatsPeriod(bot, query, telegramId) {
  const period = query.data.split(':')[1];
  
  try {
    const user = await User.findByTelegramId(telegramId);
    const vendor = await Vendor.findOne({ owner: user._id });
    
    if (!vendor) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
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
      vendor: vendor._id,
      createdAt: { $gte: startDate }
    });
    
    const revenue = await Order.aggregate([
      {
        $match: {
          vendor: vendor._id,
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'in_transit', 'picked_up'] }
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
    
    const statsText = `📊 Statistika (${periodText})\n\n📦 Buyurtmalar: ${orders}\n💰 Daromad: ${revenue[0]?.total || 0} so'm`;
    
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

async function handleVendorProducts(bot, msg, user) {
  try {
    const vendor = await Vendor.findOne({ owner: user._id });
    
    if (!vendor) {
      await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
      return;
    }
    
    const products = await Product.find({ vendor: vendor._id }).limit(20);
    
    await bot.sendMessage(
      msg.chat.id,
      `🍽️ Mahsulotlar (${products.length})`,
      keyboards.productsList(products)
    );
  } catch (error) {
    console.error('Vendor products error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleVendorProductsCallback(bot, query, telegramId) {
  try {
    const user = await User.findByTelegramId(telegramId);
    const vendor = await Vendor.findOne({ owner: user._id });
    
    if (!vendor) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    const products = await Product.find({ vendor: vendor._id }).limit(20);
    
    await bot.editMessageText(
      `🍽️ Mahsulotlar (${products.length})`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.productsList(products).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Vendor products callback error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewProduct(bot, query, telegramId) {
  const productId = query.data.split(':')[1];
  
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    let productText = `🍽️ ${product.name}\n\n`;
    productText += `📝 ${product.description}\n`;
    productText += `💰 Narx: ${product.price} so'm\n`;
    productText += `📦 Zaxira: ${product.stock?.quantity || 0}\n`;
    productText += `${product.isAvailable ? '✅ Mavjud' : '❌ Mavjud emas'}`;
    
    await bot.editMessageText(
      productText,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.productActions(productId, product.isAvailable).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View product error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleToggleProduct(bot, query, telegramId) {
  const productId = query.data.split(':')[1];
  
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    product.isAvailable = !product.isAvailable;
    await product.save();
    
    await bot.answerCallbackQuery(query.id, { 
      text: product.isAvailable ? '✅ Mahsulot yoqildi' : '❌ Mahsulot o\'chirildi' 
    });
    
    await handleViewProduct(bot, { ...query, data: `vendor_product:${productId}` }, telegramId);
  } catch (error) {
    console.error('Toggle product error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleAddProduct(bot, query, telegramId) {
  try {
    await sessionManager.setSession(telegramId, 'product_creation', {
      step: 'enter_name'
    });
    
    await bot.sendMessage(query.message.chat.id, 'Mahsulot nomini kiriting:');
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Add product error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleVendorTextInput(bot, msg) {
  const telegramId = msg.from.id.toString();
  
  try {
    const session = await sessionManager.getSession(telegramId);
    
    if (!session) {
      return;
    }
    
    if (session.sessionType === 'order_rejection' && session.currentStep === 'enter_reason') {
      const { orderId } = session.data;
      
      const order = await Order.findById(orderId).populate('customer', 'telegramId');
      
      if (!order) {
        await bot.sendMessage(msg.chat.id, messages.errorOccurred);
        return;
      }
      
      order.status = 'rejected';
      order.cancellationReason = msg.text;
      await order.save();
      
      await bot.sendMessage(msg.chat.id, messages.orderRejected(order.orderNumber));
      
      if (order.customer.telegramId) {
        try {
          await bot.sendMessage(
            order.customer.telegramId,
            messages.orderRejectedByVendor(order.orderNumber, msg.text)
          );
        } catch (err) {
          console.error('Failed to notify customer:', err);
        }
      }
      
      await sessionManager.completeSession(telegramId);
    }
  } catch (error) {
    console.error('Vendor text input error:', error);
  }
}

module.exports = { setupVendorHandlers };
