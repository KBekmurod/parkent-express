const messages = require('../messages/uzbek.messages');
const keyboards = require('../keyboards/customer.keyboards');
const sessionManager = require('../middleware/sessionManager');
const { requireRole } = require('../middleware/roleCheck');

const orderService = require('../../services/orderService');
const vendorService = require('../../services/vendorService');
const locationService = require('../../services/locationService');
const Vendor = require('../../models/Vendor');
const Order = require('../../models/Order');

function setupCustomerHandlers(bot) {
  bot.onText(/🛍️ Buyurtma berish/, async (msg) => {
    const user = await requireRole(bot, msg, 'customer');
    if (!user) return;
    
    await handleStartOrder(bot, msg, user);
  });
  
  bot.onText(/📦 Mening buyurtmalarim/, async (msg) => {
    const user = await requireRole(bot, msg, 'customer');
    if (!user) return;
    
    await handleMyOrders(bot, msg, user);
  });
  
  bot.onText(/❓ Yordam/, async (msg) => {
    const user = await requireRole(bot, msg, 'customer');
    if (!user) return;
    
    await bot.sendMessage(msg.chat.id, messages.helpMessage, keyboards.mainMenu());
  });
  
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const telegramId = query.from.id.toString();
    
    try {
      if (data.startsWith('select_vendor:')) {
        await handleVendorSelection(bot, query, telegramId);
      } else if (data.startsWith('payment:')) {
        await handlePaymentSelection(bot, query, telegramId);
      } else if (data === 'order_confirm') {
        await handleOrderConfirmation(bot, query, telegramId);
      } else if (data === 'order_edit') {
        await handleOrderEdit(bot, query, telegramId);
      } else if (data === 'order_cancel') {
        await handleOrderCancel(bot, query, telegramId);
      } else if (data.startsWith('edit_field:')) {
        await handleEditField(bot, query, telegramId);
      } else if (data.startsWith('view_order:')) {
        await handleViewOrder(bot, query, telegramId);
      } else if (data === 'my_orders') {
        await handleMyOrdersCallback(bot, query, telegramId);
      } else if (data.startsWith('cancel_order:')) {
        await handleCancelOrderRequest(bot, query, telegramId);
      } else if (data.startsWith('confirm_cancel:')) {
        await handleConfirmCancelOrder(bot, query, telegramId);
      } else if (data.startsWith('track_order:')) {
        await handleTrackOrder(bot, query, telegramId);
      } else if (data.startsWith('rate:')) {
        await handleRating(bot, query, telegramId);
      } else if (data === 'back_to_main') {
        await bot.sendMessage(chatId, messages.customerMainMenu, keyboards.mainMenu());
        await bot.answerCallbackQuery(query.id);
      }
    } catch (error) {
      console.error('Customer callback error:', error);
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
    }
  });
  
  bot.on('location', async (msg) => {
    if (msg.location) {
      await handleLocationReceived(bot, msg);
    }
  });
  
  bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/') && !['🛍️ Buyurtma berish', '📦 Mening buyurtmalarim', '❓ Yordam'].includes(msg.text)) {
      await handleTextInput(bot, msg);
    }
  });
}

async function handleStartOrder(bot, msg, user) {
  try {
    const vendors = await Vendor.find({ isActive: true }).limit(20);
    
    if (!vendors || vendors.length === 0) {
      await bot.sendMessage(msg.chat.id, messages.noVendorsAvailable, keyboards.mainMenu());
      return;
    }
    
    const vendorsWithStatus = vendors.map(v => ({
      ...v.toObject(),
      isOpen: v.isCurrentlyOpen()
    }));
    
    await sessionManager.setSession(user.telegramId, 'order_creation', {
      step: 'select_vendor'
    });
    
    await bot.sendMessage(
      msg.chat.id,
      messages.selectVendor,
      keyboards.vendorsList(vendorsWithStatus)
    );
  } catch (error) {
    console.error('Start order error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleVendorSelection(bot, query, telegramId) {
  const vendorId = query.data.split(':')[1];
  
  try {
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor || !vendor.isActive) {
      await bot.answerCallbackQuery(query.id, { text: messages.noVendorsAvailable });
      return;
    }
    
    await sessionManager.updateSession(telegramId, {
      vendorId: vendorId,
      vendorName: vendor.name,
      step: 'request_location'
    });
    
    await bot.editMessageText(
      messages.enterOrderDetails(vendor.name),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.sendMessage(
      query.message.chat.id,
      messages.sendLocation,
      keyboards.locationRequest()
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Vendor selection error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleLocationReceived(bot, msg) {
  const telegramId = msg.from.id.toString();
  
  try {
    const session = await sessionManager.getSession(telegramId);
    
    if (!session || session.sessionType !== 'order_creation') {
      return;
    }
    
    const { latitude, longitude } = msg.location;
    
    const isInParkent = locationService.isInParkent(latitude, longitude);
    
    if (!isInParkent) {
      await bot.sendMessage(msg.chat.id, messages.locationNotInParkent);
      return;
    }
    
    const address = await locationService.reverseGeocode(latitude, longitude) || 'Parkent';
    
    await sessionManager.updateSession(telegramId, {
      location: {
        latitude,
        longitude,
        address
      },
      step: 'enter_details'
    });
    
    const sessionData = await sessionManager.getSession(telegramId);
    
    await bot.sendMessage(
      msg.chat.id,
      messages.enterOrderDetails(sessionData.data.vendorName),
      { reply_markup: { remove_keyboard: true } }
    );
  } catch (error) {
    console.error('Location received error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred);
  }
}

async function handleTextInput(bot, msg) {
  const telegramId = msg.from.id.toString();
  
  try {
    const session = await sessionManager.getSession(telegramId);
    
    if (!session) {
      return;
    }
    
    if (session.sessionType === 'order_creation' && session.currentStep === 'enter_details') {
      await sessionManager.updateSession(telegramId, {
        orderDetails: msg.text,
        step: 'select_payment'
      });
      
      await bot.sendMessage(
        msg.chat.id,
        messages.selectPaymentMethod,
        keyboards.paymentTypes()
      );
    } else if (session.sessionType === 'order_creation' && session.currentStep === 'edit_details') {
      await sessionManager.updateSession(telegramId, {
        orderDetails: msg.text,
        step: 'confirm'
      });
      
      await showOrderConfirmation(bot, msg.chat.id, telegramId);
    }
  } catch (error) {
    console.error('Text input error:', error);
  }
}

async function handlePaymentSelection(bot, query, telegramId) {
  const paymentMethod = query.data.split(':')[1];
  
  try {
    await sessionManager.updateSession(telegramId, {
      paymentMethod,
      step: 'confirm'
    });
    
    await showOrderConfirmation(bot, query.message.chat.id, telegramId);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Payment selection error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function showOrderConfirmation(bot, chatId, telegramId) {
  try {
    const session = await sessionManager.getSession(telegramId);
    
    if (!session) {
      await bot.sendMessage(chatId, messages.sessionExpired);
      return;
    }
    
    const { vendorName, location, orderDetails, paymentMethod } = session.data;
    
    const summary = messages.orderSummary({
      vendorName,
      address: location?.address || 'Parkent',
      details: orderDetails,
      paymentMethod
    });
    
    await bot.sendMessage(
      chatId,
      messages.orderConfirmation(summary),
      keyboards.orderConfirmation()
    );
  } catch (error) {
    console.error('Show order confirmation error:', error);
    await bot.sendMessage(chatId, messages.errorOccurred);
  }
}

async function handleOrderConfirmation(bot, query, telegramId) {
  try {
    const session = await sessionManager.getSession(telegramId);
    
    if (!session || session.sessionType !== 'order_creation') {
      await bot.answerCallbackQuery(query.id, { text: messages.sessionExpired });
      return;
    }
    
    const { vendorId, location, orderDetails, paymentMethod } = session.data;
    
    const user = await require('../../models/User').findByTelegramId(telegramId);
    
    const orderData = {
      vendorId,
      items: [],
      deliveryAddress: {
        street: location.address || 'Parkent',
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        }
      },
      paymentMethod: paymentMethod || 'cash',
      notes: orderDetails
    };
    
    const vendor = await Vendor.findById(vendorId).populate('owner');
    
    if (!vendor) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    const order = new Order({
      customer: user._id,
      vendor: vendorId,
      status: 'pending',
      items: [],
      pricing: {
        subtotal: 0,
        deliveryFee: 5000,
        serviceFee: 0,
        discount: 0,
        total: 5000
      },
      deliveryAddress: orderData.deliveryAddress,
      paymentMethod: orderData.paymentMethod,
      notes: {
        customer: orderData.notes
      },
      preparationTime: 30
    });
    
    await order.save();
    await order.populate(['customer', 'vendor']);
    
    await bot.editMessageText(
      messages.orderCreated(order.orderNumber),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    if (vendor.owner && vendor.owner.telegramId) {
      try {
        await bot.sendMessage(
          vendor.owner.telegramId,
          messages.newOrderNotification(order)
        );
      } catch (err) {
        console.error('Failed to notify vendor:', err);
      }
    }
    
    await sessionManager.completeSession(telegramId);
    
    await bot.sendMessage(query.message.chat.id, messages.customerMainMenu, keyboards.mainMenu());
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Order confirmation error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleOrderEdit(bot, query, telegramId) {
  try {
    await bot.editMessageReplyMarkup(
      keyboards.orderEditOptions().reply_markup,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Order edit error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleEditField(bot, query, telegramId) {
  const field = query.data.split(':')[1];
  
  try {
    await sessionManager.updateSessionStep(telegramId, `edit_${field}`);
    
    let fieldText = '';
    switch (field) {
      case 'vendor':
        fieldText = 'Do\'kon';
        break;
      case 'location':
        fieldText = 'Manzil';
        break;
      case 'details':
        fieldText = 'Buyurtma tafsilotlari';
        break;
      case 'payment':
        fieldText = 'To\'lov usuli';
        break;
    }
    
    await bot.sendMessage(
      query.message.chat.id,
      messages.orderEditingField(fieldText)
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Edit field error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleOrderCancel(bot, query, telegramId) {
  try {
    await sessionManager.clearSession(telegramId);
    
    await bot.editMessageText(
      messages.orderCancelled,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.sendMessage(query.message.chat.id, messages.customerMainMenu, keyboards.mainMenu());
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Order cancel error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleMyOrders(bot, msg, user) {
  try {
    const orders = await Order.find({ customer: user._id })
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    
    if (!orders || orders.length === 0) {
      await bot.sendMessage(msg.chat.id, messages.noOrders, keyboards.mainMenu());
      return;
    }
    
    await bot.sendMessage(
      msg.chat.id,
      messages.myOrders(orders.length),
      keyboards.myOrders(orders)
    );
  } catch (error) {
    console.error('My orders error:', error);
    await bot.sendMessage(msg.chat.id, messages.errorOccurred, keyboards.mainMenu());
  }
}

async function handleMyOrdersCallback(bot, query, telegramId) {
  try {
    const user = await require('../../models/User').findByTelegramId(telegramId);
    const orders = await Order.find({ customer: user._id })
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    
    await bot.editMessageText(
      messages.myOrders(orders.length),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.myOrders(orders).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('My orders callback error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleViewOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('vendor', 'name')
      .populate('courier', 'firstName lastName phone');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    await bot.editMessageText(
      messages.orderDetails(order),
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keyboards.orderDetails(order).reply_markup
      }
    );
    
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('View order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleCancelOrderRequest(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    await bot.editMessageReplyMarkup(
      keyboards.confirmCancellation(orderId).reply_markup,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Cancel order request error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleConfirmCancelOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId);
    
    if (!order || !order.canBeCancelled) {
      await bot.answerCallbackQuery(query.id, { text: 'Bu buyurtmani bekor qilib bo\'lmaydi' });
      return;
    }
    
    order.status = 'cancelled';
    await order.save();
    
    await bot.editMessageText(
      `✅ Buyurtma #${order.orderNumber} bekor qilindi`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma bekor qilindi' });
  } catch (error) {
    console.error('Confirm cancel order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleTrackOrder(bot, query, telegramId) {
  const orderId = query.data.split(':')[1];
  
  try {
    const order = await Order.findById(orderId)
      .populate('courier', 'firstName lastName');
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    const trackingText = messages.trackOrder(order, null);
    
    await bot.sendMessage(query.message.chat.id, trackingText);
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Track order error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

async function handleRating(bot, query, telegramId) {
  const [_, orderId, rating] = query.data.split(':');
  
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
      return;
    }
    
    order.rating = order.rating || {};
    order.rating.vendor = {
      score: parseInt(rating),
      timestamp: new Date()
    };
    
    await order.save();
    
    await bot.editMessageText(
      `⭐ Rahmat! Sizning bahongiz: ${rating}/5`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
    
    await bot.answerCallbackQuery(query.id, { text: 'Baholash saqlandi!' });
  } catch (error) {
    console.error('Rating error:', error);
    await bot.answerCallbackQuery(query.id, { text: messages.errorOccurred });
  }
}

module.exports = { setupCustomerHandlers };
