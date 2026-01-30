const sessionManager = require('../middleware/sessionManager');
const User = require('../../models/User');
const messages = require('../messages/uzbek.messages');

async function setupCustomerRegistrationScene(bot) {
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    const telegramId = msg.from.id.toString();
    
    try {
      const session = await sessionManager.getSession(telegramId);
      
      if (!session || session.sessionType !== 'registration') {
        return;
      }
      
      const { currentStep, data } = session;
      
      if (currentStep === 'enter_name') {
        await sessionManager.updateSession(telegramId, {
          firstName: msg.text
        });
        await sessionManager.updateSessionStep(telegramId, 'enter_phone');
        
        await bot.sendMessage(msg.chat.id, '📞 Telefon raqamingizni kiriting:\n\nMisol: +998901234567');
      } else if (currentStep === 'enter_phone') {
        const phone = msg.text.replace(/\s+/g, '');
        
        if (!phone.match(/^\+998\d{9}$/)) {
          await bot.sendMessage(msg.chat.id, '❌ Noto\'g\'ri format. Iltimos, +998XXXXXXXXX formatida kiriting.');
          return;
        }
        
        await sessionManager.updateSession(telegramId, {
          phone
        });
        await sessionManager.updateSessionStep(telegramId, 'enter_location');
        
        await bot.sendMessage(
          msg.chat.id,
          '📍 Joylashuvingizni yuboring yoki manzilni yozing:',
          {
            reply_markup: {
              keyboard: [
                [{ text: '📍 Joylashuvimni yuborish', request_location: true }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      }
    } catch (error) {
      console.error('Customer registration scene error:', error);
    }
  });
  
  bot.on('location', async (msg) => {
    const telegramId = msg.from.id.toString();
    
    try {
      const session = await sessionManager.getSession(telegramId);
      
      if (!session || session.sessionType !== 'registration' || session.currentStep !== 'enter_location') {
        return;
      }
      
      const { firstName, phone } = session.data;
      const { latitude, longitude } = msg.location;
      
      const existingUser = await User.findOne({
        $or: [
          { telegramId },
          { phone }
        ]
      });
      
      if (existingUser) {
        existingUser.firstName = firstName;
        existingUser.phone = phone;
        existingUser.address = {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        };
        await existingUser.save();
      } else {
        const user = new User({
          telegramId,
          username: msg.from.username,
          firstName,
          phone,
          role: 'customer',
          address: {
            city: 'Parkent',
            location: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          },
          isActive: true,
          isVerified: true,
          metadata: {
            registrationSource: 'telegram'
          }
        });
        
        await user.save();
      }
      
      await sessionManager.completeSession(telegramId);
      
      await bot.sendMessage(
        msg.chat.id,
        messages.welcomeCustomer(firstName),
        {
          reply_markup: {
            keyboard: [
              [{ text: '🛍️ Buyurtma berish' }],
              [{ text: '📦 Mening buyurtmalarim' }],
              [{ text: '❓ Yordam' }]
            ],
            resize_keyboard: true
          }
        }
      );
    } catch (error) {
      console.error('Customer registration location error:', error);
      await bot.sendMessage(msg.chat.id, messages.errorOccurred);
    }
  });
}

module.exports = { setupCustomerRegistrationScene };
