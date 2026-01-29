#!/usr/bin/env node

console.log('🔍 Verifying Parkent Express Backend Installation...\n');

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  '.env.example',
  'server.js',
  'README.md',
  
  // Models
  'models/User.js',
  'models/Order.js',
  'models/Vendor.js',
  'models/Product.js',
  'models/Courier.js',
  'models/Session.js',
  
  // Services
  'services/authService.js',
  'services/userService.js',
  'services/orderService.js',
  'services/vendorService.js',
  'services/productService.js',
  'services/courierService.js',
  'services/sessionService.js',
  'services/locationService.js',
  'services/notificationService.js',
  
  // Middleware
  'middleware/auth.js',
  'middleware/validation.js',
  'middleware/logger.js',
  'middleware/errorHandler.js',
  'middleware/index.js',
  
  // Config
  'config/config.js',
  'config/database.js',
  'config/bot.js',
  'config/socket.js',
  
  // Utils
  'utils/helpers.js',
  'utils/validators.js',
  'utils/constants.js',
  'utils/logger.js',
  
  // API
  'api/routes/index.js',
  'api/routes/auth.routes.js',
  'api/routes/user.routes.js',
  'api/routes/order.routes.js',
  'api/routes/vendor.routes.js',
  'api/routes/courier.routes.js',
  'api/routes/product.routes.js',
  
  // Socket
  'socket/index.js',
  'socket/events.js',
  'socket/middleware/auth.js',
  'socket/handlers/orderHandler.js',
  'socket/handlers/courierHandler.js',
  'socket/handlers/adminHandler.js'
];

let allFilesExist = true;
let fileCount = 0;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    fileCount++;
  } else {
    console.error(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

console.log(`📊 Files checked: ${fileCount}/${requiredFiles.length}\n`);

if (allFilesExist) {
  console.log('✅ All required files are present!\n');
  console.log('📦 Next steps:');
  console.log('   1. npm install');
  console.log('   2. cp .env.example .env');
  console.log('   3. Edit .env with your configuration');
  console.log('   4. npm start or npm run dev\n');
  process.exit(0);
} else {
  console.error('❌ Some files are missing. Please check the installation.\n');
  process.exit(1);
}
