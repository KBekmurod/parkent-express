# Parkent Express - Telegram Delivery System

[🇺🇿 O'zbekcha](#ozbekcha) | [🇬🇧 English](#english)

---

## 🇺🇿 O'zbekcha

### Loyiha haqida

**Parkent Express** - bu Parkent tumani uchun maxsus ishlab chiqilgan Telegram bot asosidagi yetkazib berish tizimi. Tizim 3 ta alohida botdan iborat:

1. **Mijoz boti** - mijozlar buyurtma berish uchun
2. **Kurer boti** - kurerlar buyurtmalarni qabul qilish va yetkazish uchun
3. **Admin boti** - administrator tizimni boshqarish uchun

### Asosiy imkoniyatlar

✅ Telegram orqali oson buyurtma berish  
✅ Naqd va kartaga to'lov imkoniyati  
✅ Kurer bilan real-time aloqa  
✅ Buyurtmalarni kuzatish  
✅ Admin panel orqali to'liq boshqarish  
✅ Kurerlar uchun statistika  

### O'rnatish

1. **Repozitoriyani klonlash:**
```bash
git clone https://github.com/KBekmurod/parkent-express.git
cd parkent-express
```

2. **Paketlarni o'rnatish:**
```bash
npm install
```

3. **MongoDB o'rnatish va ishga tushirish:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# MacOS
brew install mongodb-community
brew services start mongodb-community
```

4. **Muhit o'zgaruvchilarini sozlash:**

`.env` fayl yarating va quyidagi ma'lumotlarni kiriting:

```env
CUSTOMER_BOT_TOKEN=sizning_mijoz_bot_tokeningiz
COURIER_BOT_TOKEN=sizning_kurer_bot_tokeningiz
ADMIN_BOT_TOKEN=sizning_admin_bot_tokeningiz
MONGO_URI=mongodb://localhost:27017/parkent-express
JWT_SECRET=sizning_maxfiy_kalitingiz
NODE_ENV=development
PORT=3000
ADMIN_TELEGRAM_ID=sizning_telegram_id_ingiz
```

### Bot tokenlarini olish

1. Telegram'da [@BotFather](https://t.me/BotFather) botini oching
2. `/newbot` buyrug'ini yuboring
3. Bot nomini va username'ini kiriting
4. BotFather sizga token beradi
5. Bu jarayonni 3 marta takrorlang (har bir bot uchun)

**Muhim:** Har bir bot uchun alohida token oling!

### Telegram ID ni olish

1. Telegram'da [@userinfobot](https://t.me/userinfobot) botini oching
2. `/start` buyrug'ini yuboring
3. Bot sizning Telegram ID ingizni ko'rsatadi

### Loyihani ishga tushirish

**Ishlab chiqish rejimida:**
```bash
npm run dev
```

**Ishlab chiqarish rejimida:**
```bash
npm start
```

### Kurer qo'shish

1. Admin bot orqali `/start` buyrug'ini yuboring
2. "Kurerlar" bo'limini tanlang
3. "Kurer qo'shish" tugmasini bosing
4. Kurer Telegram ID sini yuboring

### Texnologiyalar

- **Node.js** - Server
- **Express** - Web framework
- **node-telegram-bot-api** - Telegram bot API
- **MongoDB** - Ma'lumotlar bazasi
- **Mongoose** - MongoDB ODM
- **rate-limiter-flexible** - Spam himoyasi

---

## 🇬🇧 English

### About the Project

**Parkent Express** is a Telegram bot-based delivery system specifically designed for Parkent district. The system consists of 3 separate bots:

1. **Customer Bot** - for customers to place orders
2. **Courier Bot** - for couriers to accept and deliver orders
3. **Admin Bot** - for administrators to manage the system

### Key Features

✅ Easy order placement via Telegram  
✅ Cash and card payment options  
✅ Real-time communication with courier  
✅ Order tracking  
✅ Full management via admin panel  
✅ Statistics for couriers  

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/KBekmurod/parkent-express.git
cd parkent-express
```

2. **Install dependencies:**
```bash
npm install
```

3. **Install and start MongoDB:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# MacOS
brew install mongodb-community
brew services start mongodb-community
```

4. **Configure environment variables:**

Create a `.env` file and add the following:

```env
CUSTOMER_BOT_TOKEN=your_customer_bot_token
COURIER_BOT_TOKEN=your_courier_bot_token
ADMIN_BOT_TOKEN=your_admin_bot_token
MONGO_URI=mongodb://localhost:27017/parkent-express
JWT_SECRET=your_secret_key
NODE_ENV=development
PORT=3000
ADMIN_TELEGRAM_ID=your_telegram_id
```

### Getting Bot Tokens

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` command
3. Enter bot name and username
4. BotFather will give you a token
5. Repeat this process 3 times (for each bot)

**Important:** Get a separate token for each bot!

### Getting Your Telegram ID

1. Open [@userinfobot](https://t.me/userinfobot) on Telegram
2. Send `/start` command
3. The bot will show your Telegram ID

### Running the Project

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Adding Couriers

1. Send `/start` command via Admin bot
2. Select "Couriers" section
3. Click "Add Courier" button
4. Send courier's Telegram ID

### Technology Stack

- **Node.js** - Server
- **Express** - Web framework
- **node-telegram-bot-api** - Telegram bot API
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **rate-limiter-flexible** - Anti-spam protection

### Project Structure

```
parkent-express/
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore file
├── package.json         # Project dependencies
├── README.md            # Documentation
├── server.js            # Main server file
├── config/              # Configuration files
│   ├── database.js      # Database connection
│   └── constants.js     # Application constants
├── bots/                # Bot implementations
│   ├── customer.bot.js  # Customer bot
│   ├── courier.bot.js   # Courier bot
│   └── admin.bot.js     # Admin bot
├── models/              # Database models
│   ├── User.js          # User model
│   ├── Order.js         # Order model
│   └── Session.js       # Session model
├── services/            # Business logic
│   ├── sessionService.js      # Session management
│   ├── orderService.js        # Order management
│   └── notificationService.js # Notifications
├── middleware/          # Middleware functions
│   ├── auth.js         # Authentication
│   └── rateLimit.js    # Rate limiting
└── utils/              # Utility functions
    ├── keyboard.js     # Keyboard layouts
    └── messages.js     # Message templates
```

### API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check endpoint

### Troubleshooting

**Problem:** Bots don't start
- **Solution:** Check if all tokens are correctly set in `.env` file

**Problem:** MongoDB connection error
- **Solution:** Make sure MongoDB is running: `sudo systemctl status mongodb`

**Problem:** "Module not found" error
- **Solution:** Run `npm install` to install all dependencies

**Problem:** Rate limit exceeded
- **Solution:** Wait 60 seconds before trying again

**Problem:** Bot doesn't respond
- **Solution:** Check if the bot is running and internet connection is stable

### Security Features

- ✅ All tokens stored in environment variables
- ✅ Rate limiting to prevent spam
- ✅ Role-based access control
- ✅ Session expiration after 30 minutes
- ✅ Admin verification via Telegram ID
- ✅ Courier registration required

### Order Flow

1. Customer places order via Customer Bot
2. Order appears in Courier Bot for available couriers
3. Courier accepts the order
4. Courier marks "On the way"
5. Courier marks "Delivered"
6. Customer and Admin receive notifications

### Session Management

- Sessions automatically expire after 30 minutes of inactivity
- Cleanup runs every 30 minutes
- Only one active order per customer at a time

### Database Collections

- **users** - User information and statistics
- **orders** - Order details and status
- **sessions** - User session data (auto-expires)

### Payment Methods

- **Naqd (Cash)** - Cash payment on delivery
- **Kurer kartasiga (Card to Courier)** - Card payment to courier

### Service Area

Currently serving **Parkent district only**. Location validation ensures orders are within district boundaries.

### Support

For issues or questions, contact: @parkent_express_support

### License

MIT

### Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

Made with ❤️ for Parkent community