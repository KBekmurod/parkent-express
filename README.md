# 🚀 Parkent Express - Delivery System

**A complete delivery management system for Parkent, Uzbekistan**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/next.js-14.0.4-blue.svg)](https://nextjs.org/)

## 📖 Overview

Parkent Express is a full-stack delivery management system featuring:
- 🤖 **Telegram Bot** - Multi-role interface (Customer, Vendor, Courier, Admin)
- 🎨 **Admin Panel** - Next.js 14 dashboard for system management
- 🔄 **Real-time Updates** - Socket.io for live tracking
- 📍 **Location Services** - Geo-based delivery within Parkent area
- 💰 **Payment Management** - Cash and card payment options

---

## ✨ Features

### For Customers 👥
- Browse local vendors
- Create and track orders
- Real-time delivery tracking
- Multiple payment options
- Order history and ratings

### For Vendors 🏪
- Receive order notifications
- Accept/reject orders
- Manage order status
- Product inventory management
- Daily statistics and reports

### For Couriers 🚴
- View available deliveries
- Accept delivery jobs
- Share live location
- Confirm deliveries
- Track earnings

### For Admins 👨‍💼
- Complete system overview
- Order management and assignment
- Vendor and courier registration
- System statistics and analytics
- Settings configuration

---

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Bot**: node-telegram-bot-api
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Security**: Helmet, bcryptjs

### Frontend (Admin Panel)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: MongoDB 7

---

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **MongoDB** 7.x or higher
- **Docker** (optional, for containerized deployment)
- **Telegram Bot Token** (from @BotFather)
- **Your Telegram ID** (from @userinfobot)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/KBekmurod/parkent-express.git
cd parkent-express
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### 3. Setup Admin Panel

```bash
cd admin-panel
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. Access the Application

- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000
- **Health Check**: http://localhost:5000/health

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/parkent-express

# JWT Authentication
JWT_SECRET=your_secure_random_string_here
JWT_EXPIRE=7d

# Telegram Bot
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_TELEGRAM_ID=your_telegram_id

# CORS (for admin panel)
CORS_ORIGIN=http://localhost:3000
```

### Admin Panel Environment Variables

Create `admin-panel/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# 1. Create .env file in root directory
cp .env.example .env
# Edit .env with your credentials

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f

# 5. Stop services
docker-compose down
```

### Services

- **MongoDB**: Port 27017
- **Backend**: Port 5000
- **Admin Panel**: Port 3000

---

## 📚 Getting Telegram Bot Token

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow the prompts:
   - Enter bot name (e.g., "Parkent Express")
   - Enter bot username (e.g., "parkent_express_bot")
4. Copy the token provided by BotFather
5. Paste it in your `.env` file as `BOT_TOKEN`

## 🆔 Getting Your Telegram ID

1. Open Telegram and search for **@userinfobot**
2. Send `/start` command
3. Copy your ID number
4. Paste it in your `.env` file as `ADMIN_TELEGRAM_ID`

---

## 📁 Project Structure

```
parkent-express/
├── backend/                    # Backend API and Bot
│   ├── api/                   # REST API
│   ├── bot/                   # Telegram Bot
│   ├── config/                # Configuration
│   ├── middleware/            # Express middleware
│   ├── models/                # MongoDB models
│   ├── services/              # Business logic
│   ├── socket/                # Socket.io handlers
│   ├── utils/                 # Utilities
│   └── server.js              # Entry point
│
├── admin-panel/               # Next.js Admin Dashboard
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   └── lib/                   # Utilities
│
├── docker-compose.yml         # Docker orchestration
├── .env.example              # Environment template
└── README.md                 # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login/telegram` - Login with Telegram
- `POST /api/auth/login/phone` - Login with phone

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update status

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/nearby` - Find nearby vendors

### Couriers
- `GET /api/couriers` - List couriers
- `POST /api/couriers` - Register courier
- `POST /api/couriers/location` - Update location

**Full API documentation**: See `backend/README.md`

---

## 🤖 Bot Commands

### Customer Commands
- `/start` - Start bot and show main menu
- `/order` - Create new order
- `/myorders` - View my orders
- `/help` - Get help
- `/cancel` - Cancel current action

### Vendor Commands
- `/start` - Show vendor menu
- `/orders` - View pending orders
- `/products` - Manage products
- `/stats` - View statistics

### Courier Commands
- `/start` - Show courier menu
- `/available` - View available orders
- `/mystats` - View my statistics

### Admin Commands
- `/start` - Show admin menu
- `/orders` - View all orders
- `/vendors` - Manage vendors
- `/couriers` - Manage couriers

---

## 📖 Additional Documentation

- **Setup Guide**: See [SETUP.md](./SETUP.md)
- **Backend API**: See [backend/README.md](./backend/README.md)
- **Admin Panel**: See [admin-panel/README.md](./admin-panel/README.md)

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify environment variables
- Check port 5000 is available

### Bot not responding
- Verify `BOT_TOKEN` in `.env`
- Check bot is registered with @BotFather

### Admin panel connection error
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in `.env`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Bekmurod Karimov**
- GitHub: [@KBekmurod](https://github.com/KBekmurod)

---

**Made with ❤️ for Parkent, Uzbekistan**