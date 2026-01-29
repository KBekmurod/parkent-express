const sessionManager = require('../middleware/sessionManager');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const messages = require('../messages/uzbek.messages');

async function setupVendorRegistrationScene(bot) {
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    const telegramId = msg.from.id.toString();
    
    try {
      const session = await sessionManager.getSession(telegramId);
      
      if (!session || session.sessionType !== 'vendor_registration') {
        return;
      }
      
      const { currentStep } = session;
      
      if (currentStep === 'enter_name') {
        await sessionManager.updateSession(telegramId, {
          vendorName: msg.text
        });
        await sessionManager.updateSessionStep(telegramId, 'enter_description');
        
        await bot.sendMessage(msg.chat.id, '📝 Do\'kon tavsifini kiriting:');
      } else if (currentStep === 'enter_description') {
        await sessionManager.updateSession(telegramId, {
          description: msg.text
        });
        await sessionManager.updateSessionStep(telegramId, 'enter_phone');
        
        await bot.sendMessage(msg.chat.id, '📞 Telefon raqamini kiriting:\n\nMisol: +998901234567');
      } else if (currentStep === 'enter_phone') {
        const phone = msg.text.replace(/\s+/g, '');
        
        if (!phone.match(/^\+998\d{9}$/)) {
          await bot.sendMessage(msg.chat.id, '❌ Noto\'g\'ri format. Iltimos, +998XXXXXXXXX formatida kiriting.');
          return;
        }
        
        await sessionManager.updateSession(telegramId, {
          phone
        });
        await sessionManager.updateSessionStep(telegramId, 'enter_owner_telegram');
        
        await bot.sendMessage(msg.chat.id, '👤 Egasining Telegram ID sini kiriting:');
      } else if (currentStep === 'enter_owner_telegram') {
        const ownerTelegramId = msg.text.trim();
        
        const owner = await User.findOne({ telegramId: ownerTelegramId });
        
        if (!owner) {
          await bot.sendMessage(msg.chat.id, '❌ Foydalanuvchi topilmadi. Avval foydalanuvchi ro\'yxatdan o\'tishi kerak.');
          return;
        }
        
        owner.role = 'vendor';
        await owner.save();
        
        await sessionManager.updateSession(telegramId, {
          ownerId: owner._id
        });
        await sessionManager.updateSessionStep(telegramId, 'enter_location');
        
        await bot.sendMessage(
          msg.chat.id,
          '📍 Do\'kon joylashuvini yuboring:',
          {
            reply_markup: {
              keyboard: [
                [{ text: '📍 Joylashuv yuborish', request_location: true }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      }
    } catch (error) {
      console.error('Vendor registration scene error:', error);
      await bot.sendMessage(msg.chat.id, messages.errorOccurred);
    }
  });
  
  bot.on('location', async (msg) => {
    const telegramId = msg.from.id.toString();
    
    try {
      const session = await sessionManager.getSession(telegramId);
      
      if (!session || session.sessionType !== 'vendor_registration' || session.currentStep !== 'enter_location') {
        return;
      }
      
      const { vendorName, description, phone, ownerId } = session.data;
      const { latitude, longitude } = msg.location;
      
      const vendor = new Vendor({
        name: vendorName,
        description,
        owner: ownerId,
        category: 'other',
        address: {
          street: 'Parkent',
          city: 'Parkent',
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        },
        contact: {
          phone
        },
        workingHours: [
          { day: 0, open: '09:00', close: '20:00', isOpen: true },
          { day: 1, open: '09:00', close: '20:00', isOpen: true },
          { day: 2, open: '09:00', close: '20:00', isOpen: true },
          { day: 3, open: '09:00', close: '20:00', isOpen: true },
          { day: 4, open: '09:00', close: '20:00', isOpen: true },
          { day: 5, open: '09:00', close: '20:00', isOpen: true },
          { day: 6, open: '09:00', close: '20:00', isOpen: true }
        ],
        isActive: true
      });
      
      await vendor.save();
      
      await sessionManager.completeSession(telegramId);
      
      await bot.sendMessage(
        msg.chat.id,
        messages.registrationCompleted('vendor', vendorName),
        { reply_markup: { remove_keyboard: true } }
      );
    } catch (error) {
      console.error('Vendor registration location error:', error);
      await bot.sendMessage(msg.chat.id, messages.errorOccurred);
    }
  });
}

module.exports = { setupVendorRegistrationScene };
