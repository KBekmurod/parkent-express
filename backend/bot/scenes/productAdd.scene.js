const sessionManager = require('../middleware/sessionManager');
const Product = require('../../models/Product');
const Vendor = require('../../models/Vendor');
const User = require('../../models/User');
const messages = require('../messages/uzbek.messages');

async function setupProductAddScene(bot) {
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    const telegramId = msg.from.id.toString();
    
    try {
      const session = await sessionManager.getSession(telegramId);
      
      if (!session || session.sessionType !== 'product_creation') {
        return;
      }
      
      const { currentStep } = session;
      
      if (currentStep === 'enter_name') {
        await sessionManager.updateSession(telegramId, {
          productName: msg.text
        });
        await sessionManager.updateSessionStep(telegramId, 'enter_description');
        
        await bot.sendMessage(msg.chat.id, '📝 Mahsulot tavsifini kiriting:');
      } else if (currentStep === 'enter_description') {
        await sessionManager.updateSession(telegramId, {
          description: msg.text
        });
        await sessionManager.updateSessionStep(telegramId, 'enter_price');
        
        await bot.sendMessage(msg.chat.id, '💰 Narxini kiriting (so\'mda):\n\nMisol: 25000');
      } else if (currentStep === 'enter_price') {
        const price = parseInt(msg.text.replace(/\s/g, ''));
        
        if (isNaN(price) || price <= 0) {
          await bot.sendMessage(msg.chat.id, '❌ Noto\'g\'ri narx. Iltimos, faqat raqam kiriting.');
          return;
        }
        
        const user = await User.findByTelegramId(telegramId);
        const vendor = await Vendor.findOne({ owner: user._id });
        
        if (!vendor) {
          await bot.sendMessage(msg.chat.id, messages.errorOccurred);
          await sessionManager.clearSession(telegramId);
          return;
        }
        
        const { productName, description } = session.data;
        
        const product = new Product({
          vendor: vendor._id,
          name: productName,
          description,
          price,
          category: 'other',
          isAvailable: true,
          stock: {
            quantity: 100,
            unit: 'pcs'
          }
        });
        
        await product.save();
        
        await sessionManager.completeSession(telegramId);
        
        await bot.sendMessage(
          msg.chat.id,
          `✅ Mahsulot qo'shildi!\n\n🍽️ ${productName}\n💰 ${price} so'm`,
          {
            reply_markup: {
              keyboard: [
                [{ text: '📦 Buyurtmalar' }],
                [{ text: '📊 Statistika' }, { text: '🍽️ Mahsulotlar' }]
              ],
              resize_keyboard: true
            }
          }
        );
      }
    } catch (error) {
      console.error('Product add scene error:', error);
      await bot.sendMessage(msg.chat.id, messages.errorOccurred);
    }
  });
}

module.exports = { setupProductAddScene };
