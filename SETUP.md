# Quick Setup Guide - Parkent Express

## Prerequisites

Before you begin, make sure you have:
- Node.js (v14 or higher) installed
- MongoDB installed and running
- 3 Telegram bot tokens from @BotFather
- Your Telegram ID from @userinfobot

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone https://github.com/KBekmurod/parkent-express.git
cd parkent-express
npm install
```

### 2. Get Bot Tokens

Open [@BotFather](https://t.me/BotFather) on Telegram and create 3 bots:

**For Customer Bot:**
```
/newbot
Bot name: Parkent Express Customer
Username: parkent_express_customer_bot
```

**For Courier Bot:**
```
/newbot
Bot name: Parkent Express Courier
Username: parkent_express_courier_bot
```

**For Admin Bot:**
```
/newbot
Bot name: Parkent Express Admin
Username: parkent_express_admin_bot
```

BotFather will give you a token for each bot. Save these tokens!

### 3. Get Your Telegram ID

1. Open [@userinfobot](https://t.me/userinfobot) on Telegram
2. Send `/start`
3. Copy your ID number

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file and fill in your values:

```env
CUSTOMER_BOT_TOKEN=YOUR_CUSTOMER_BOT_TOKEN_HERE
COURIER_BOT_TOKEN=YOUR_COURIER_BOT_TOKEN_HERE
ADMIN_BOT_TOKEN=YOUR_ADMIN_BOT_TOKEN_HERE
MONGO_URI=mongodb://localhost:27017/parkent-express
JWT_SECRET=your_random_secret_key_here
NODE_ENV=production
PORT=3000
ADMIN_TELEGRAM_ID=YOUR_TELEGRAM_ID_HERE
```

**Important:** Replace all placeholder values with your actual tokens and IDs!

### 5. Start MongoDB

**Ubuntu/Debian:**
```bash
sudo systemctl start mongodb
sudo systemctl status mongodb
```

**MacOS:**
```bash
brew services start mongodb-community
```

**Windows:**
```bash
net start MongoDB
```

### 6. Start the Application

**Production mode:**
```bash
npm start
```

**Development mode (with auto-restart):**
```bash
npm run dev
```

You should see:
```
🚀 PARKENT EXPRESS - TELEGRAM DELIVERY SYSTEM
✅ Server running on port 3000
✅ Customer bot active
✅ Courier bot active
✅ Admin bot active
✅ MongoDB connected
```

### 7. Test the Bots

**Test Customer Bot:**
1. Find your customer bot on Telegram
2. Send `/start`
3. You should see the welcome message with buttons

**Test Admin Bot:**
1. Find your admin bot on Telegram
2. Send `/start`
3. You should see the admin panel

**Test Courier Bot:**
1. First, add a courier using the Admin bot
2. In Admin bot, go to "Kurerlar" → "Kurer qo'shish"
3. Send the courier's Telegram ID
4. Now the courier can access the Courier bot

## Adding Couriers

1. Get the courier's Telegram ID (they can get it from @userinfobot)
2. Open your Admin bot
3. Send `/start`
4. Click "👨‍✈️ Kurerlar"
5. Click "➕ Kurer qo'shish"
6. Send the courier's Telegram ID
7. Done! The courier can now use the Courier bot

## Testing the Full Flow

1. **Customer places order:**
   - Open Customer bot
   - Click "🛒 Buyurtma berish"
   - Follow the steps to place an order

2. **Courier accepts order:**
   - Open Courier bot
   - Click "🚚 Buyurtmalar"
   - Click "✅ Qabul qilish" on the order

3. **Courier delivers:**
   - Click "🚴 Yo'ldaman"
   - When delivered, click "📦 Yetkazdim"

4. **Admin monitors:**
   - Open Admin bot
   - Click "📋 Buyurtmalar" to see all orders
   - Click "📊 Statistika" to see statistics

## Common Issues

### Bots don't respond
- Check if all tokens are correct in `.env`
- Make sure the application is running (`npm start`)
- Check internet connection

### MongoDB connection error
- Make sure MongoDB is running: `sudo systemctl status mongodb`
- Check if `MONGO_URI` in `.env` is correct

### "Not authorized" message
- For Admin bot: Check if `ADMIN_TELEGRAM_ID` matches your Telegram ID
- For Courier bot: Make sure you're added as a courier via Admin bot

### Port already in use
- Change `PORT` in `.env` to a different number (e.g., 3001)
- Or stop the process using that port

## Keeping the Bot Running 24/7

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start server.js --name parkent-express

# Enable auto-start on system reboot
pm2 startup
pm2 save
```

### Using systemd (Linux)

Create `/etc/systemd/system/parkent-express.service`:

```ini
[Unit]
Description=Parkent Express Delivery System
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/parkent-express
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable parkent-express
sudo systemctl start parkent-express
```

## Security Best Practices

1. **Never commit `.env` file** - It contains sensitive tokens
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Enable firewall** - Only expose necessary ports
5. **Use HTTPS** - If deploying with a web interface
6. **Regular backups** - Backup your MongoDB database

## Support

For questions or issues:
- Open an issue on GitHub
- Contact: @parkent_express_support (Telegram)

## Next Steps

- Customize messages in `utils/messages.js`
- Adjust rate limits in `config/constants.js`
- Add more features as needed
- Set up monitoring and logging

---

Made with ❤️ for Parkent community
