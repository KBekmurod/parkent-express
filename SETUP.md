# 📖 Parkent Express - Setup Guide

Complete step-by-step guide to set up and run Parkent Express locally or with Docker.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Setup](#docker-setup)
4. [Getting Telegram Credentials](#getting-telegram-credentials)
5. [Testing the System](#testing-the-system)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software

- **Node.js**: Version 20.x or higher
  ```bash
  node --version  # Should show v20.x.x or higher
  ```

- **npm**: Comes with Node.js
  ```bash
  npm --version  # Should show 10.x.x or higher
  ```

- **MongoDB**: Version 7.x or higher
  ```bash
  mongosh --version  # Should show 2.x.x or higher
  ```

- **Git**: For cloning repository
  ```bash
  git --version
  ```

### Optional (for Docker deployment)

- **Docker**: Version 24.x or higher
  ```bash
  docker --version
  ```

- **Docker Compose**: Version 2.x or higher
  ```bash
  docker-compose --version
  ```

---

## 2. Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/KBekmurod/parkent-express.git
cd parkent-express
```

### Step 2: Setup MongoDB

#### Option A: Install MongoDB Locally

**On macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**On Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**On Windows:**
- Download installer from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- Run the installer
- Start MongoDB as a service

#### Option B: Use MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get connection string
5. Use the connection string in your `.env` file

#### Verify MongoDB is Running

```bash
mongosh
# Should connect to MongoDB shell
# Type 'exit' to quit
```

### Step 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use any text editor
```

**Edit `backend/.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/parkent-express
JWT_SECRET=your_secure_random_string_here_min_32_chars
JWT_EXPIRE=7d
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TELEGRAM_ID=your_telegram_id_here
CORS_ORIGIN=http://localhost:3000
```

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Get Telegram Credentials

See [Getting Telegram Credentials](#getting-telegram-credentials) section below.

### Step 5: Start Backend

```bash
# Still in backend directory
npm start

# For development with auto-reload:
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Socket.io server initialized
✅ Telegram bot initialized
✅ Server running on port 5000
```

### Step 6: Setup Admin Panel

Open a new terminal window:

```bash
cd parkent-express/admin-panel

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env  # or use any text editor
```

**Edit `admin-panel/.env`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Step 7: Start Admin Panel

```bash
# Still in admin-panel directory
npm run dev
```

You should see:
```
✓ Ready on http://localhost:3000
```

### Step 8: Access the Application

Open your browser:
- **Admin Panel**: http://localhost:3000
- **API Health**: http://localhost:5000/health
- **Telegram Bot**: Open Telegram and search for your bot

---

## 3. Docker Setup

Docker provides a simpler way to run all services together.

### Step 1: Install Docker

**On macOS/Windows:**
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install and start Docker Desktop

**On Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER  # Add user to docker group
```

### Step 2: Configure Environment

```bash
cd parkent-express

# Create environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Edit `.env`:**
```env
BOT_TOKEN=your_telegram_bot_token_here
JWT_SECRET=your_secure_random_string_here
ADMIN_TELEGRAM_ID=your_telegram_id_here
MONGODB_URI=mongodb://mongodb:27017/parkent-express
NODE_ENV=production
```

### Step 3: Build and Start Services

```bash
# Build images and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Step 4: Verify Services

```bash
# Check all services are healthy
docker-compose ps

# Should show:
# NAME                STATUS              PORTS
# parkent-mongo       Up (healthy)        27017->27017/tcp
# parkent-backend     Up (healthy)        5000->5000/tcp
# parkent-admin       Up                  3000->3000/tcp
```

### Step 5: Access Application

- **Admin Panel**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Docker Management Commands

```bash
# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs for specific service
docker-compose logs -f backend

# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

---

## 4. Getting Telegram Credentials

### Get Bot Token from BotFather

1. **Open Telegram** app or web version

2. **Search for @BotFather** in Telegram search

3. **Start conversation** with BotFather:
   ```
   /start
   ```

4. **Create a new bot**:
   ```
   /newbot
   ```

5. **Follow the prompts**:
   - Enter bot name: `Parkent Express` (or any name)
   - Enter bot username: `parkent_express_bot` (must end with 'bot')

6. **Copy the token** provided by BotFather:
   ```
   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
   ```

7. **Add token to .env**:
   ```env
   BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
   ```

### Get Your Telegram ID

1. **Search for @userinfobot** in Telegram

2. **Start conversation**:
   ```
   /start
   ```

3. **Copy your ID**:
   ```
   Id: 123456789
   ```

4. **Add to .env**:
   ```env
   ADMIN_TELEGRAM_ID=123456789
   ```

### Configure Bot Settings (Optional)

With @BotFather:

```
/setdescription - Set bot description
/setabouttext - Set about text
/setuserpic - Set bot profile picture
/setcommands - Set bot commands
```

**Recommended commands:**
```
start - Start the bot
order - Create new order
myorders - View my orders
help - Get help
cancel - Cancel current action
```

---

## 5. Testing the System

### Test Backend Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "bot": "initialized",
  "socket": "active",
  "timestamp": "2024-01-29T12:00:00.000Z"
}
```

### Test Admin Login

1. Open http://localhost:3000
2. You should see the login page
3. Enter your Telegram ID as username
4. Use any password (or set up authentication)

### Test Telegram Bot

1. **Open your bot** in Telegram (search for username)

2. **Send /start command**

3. **Expected response**: Welcome message in Uzbek with menu

4. **Create a test user** (if needed):
   ```bash
   # Connect to MongoDB
   mongosh parkent-express
   
   # Create admin user
   db.users.insertOne({
     telegramId: "YOUR_TELEGRAM_ID",
     role: "admin",
     firstName: "Admin",
     lastName: "User",
     isActive: true,
     createdAt: new Date()
   })
   ```

5. **Send /start again** - should show admin menu

### Test Order Flow (Complete Integration)

#### As Admin (via Telegram):

1. Register a vendor:
   - Send `/start`
   - Select "Do'konlar"
   - Select "Yangi do'kon"
   - Fill in details

2. Register a courier:
   - Select "Kurerlar"
   - Select "Yangi kurer"
   - Fill in details

#### As Customer (via Telegram):

1. Create an order:
   - Send `/start`
   - Select "Buyurtma berish"
   - Choose vendor
   - Send location
   - Enter order details
   - Select payment method
   - Confirm order

2. Track order:
   - Select "Mening buyurtmalarim"
   - View order status

#### As Vendor (via Telegram):

1. Receive notification about new order
2. Accept order
3. Mark as preparing
4. Mark as ready

#### As Courier (via Telegram):

1. View available orders
2. Accept delivery
3. Mark picked up
4. Share location
5. Mark delivered

#### Via Admin Panel:

1. Login at http://localhost:3000
2. View dashboard with real-time stats
3. See new order appear in orders list
4. Track order progress
5. View courier location on map

---

## 6. Production Deployment

### Prepare for Production

1. **Update environment variables**:
   ```env
   NODE_ENV=production
   ```

2. **Use strong secrets**:
   ```bash
   # Generate strong JWT secret
   openssl rand -base64 64
   ```

3. **Configure CORS**:
   ```env
   CORS_ORIGIN=https://your-domain.com
   ```

4. **Set up SSL/TLS** (use nginx or similar)

### Deploy with Docker

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start in production mode
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Deploy to Cloud

#### AWS EC2:

1. Launch EC2 instance (Ubuntu 22.04)
2. Install Docker and Docker Compose
3. Clone repository
4. Configure `.env`
5. Run `docker-compose up -d`

#### DigitalOcean Droplet:

1. Create droplet (Docker marketplace)
2. SSH into droplet
3. Clone repository
4. Configure `.env`
5. Run `docker-compose up -d`

#### Heroku:

```bash
# Login to Heroku
heroku login

# Create apps
heroku create parkent-backend
heroku create parkent-admin

# Deploy backend
cd backend
git push heroku main

# Deploy admin
cd admin-panel
git push heroku main
```

### Set Up Monitoring

```bash
# View container stats
docker stats

# Set up health checks
# Already configured in docker-compose.yml
```

---

## 7. Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

**MongoDB connection error:**
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check connection
mongosh
```

**Bot token error:**
- Verify token in `.env` matches BotFather token
- Ensure no extra spaces in token
- Regenerate token with @BotFather if needed

### Admin Panel Issues

**API connection error:**
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check environment variable
cat admin-panel/.env | grep API_URL
```

**Build errors:**
```bash
# Clear Next.js cache
cd admin-panel
rm -rf .next
npm run build
```

### Docker Issues

**Container won't start:**
```bash
# View container logs
docker-compose logs backend

# Restart specific container
docker-compose restart backend

# Rebuild container
docker-compose up -d --build backend
```

**Database connection in Docker:**
- Use `mongodb://mongodb:27017` (not localhost)
- MongoDB service name is 'mongodb' in docker-compose

**Permission errors:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
```

### Common Fixes

**Clear all data and restart:**
```bash
# With Docker
docker-compose down -v
docker-compose up -d

# Without Docker
# Drop MongoDB database
mongosh parkent-express --eval "db.dropDatabase()"
# Restart backend
```

**Reset admin user:**
```bash
mongosh parkent-express
db.users.updateOne(
  { telegramId: "YOUR_ID" },
  { $set: { role: "admin", isActive: true } }
)
```

---

## 📞 Getting Help

If you encounter issues:

1. Check this guide thoroughly
2. Review error messages in logs
3. Check [GitHub Issues](https://github.com/KBekmurod/parkent-express/issues)
4. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

---

## ✅ Setup Complete!

Your Parkent Express system should now be running:

- ✅ Backend API on port 5000
- ✅ Admin Panel on port 3000
- ✅ Telegram Bot responding to commands
- ✅ MongoDB storing data
- ✅ Real-time updates working

**Next Steps:**
- Register vendors through admin panel or bot
- Register couriers through admin panel or bot
- Create test orders
- Monitor system through admin dashboard

**Happy delivering! 🚀**
