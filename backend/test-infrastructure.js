#!/usr/bin/env node

const path = require('path');

console.log('=== Testing Parkent Express Backend Infrastructure ===\n');

const modules = [
  { name: 'Constants', path: './config/constants' },
  { name: 'Logger', path: './utils/logger' },
  { name: 'Error Types', path: './utils/errorTypes' },
  { name: 'Helpers', path: './utils/helpers' }
];

let allPassed = true;

for (const module of modules) {
  try {
    const loaded = require(module.path);
    console.log(`✓ ${module.name} loaded successfully`);
    
    if (module.name === 'Constants') {
      console.log(`  - Roles: ${Object.keys(loaded.ROLES).length}`);
      console.log(`  - Order Statuses: ${Object.keys(loaded.ORDER_STATUSES).length}`);
      console.log(`  - Payment Types: ${Object.keys(loaded.PAYMENT_TYPES).length}`);
    } else if (module.name === 'Helpers') {
      const orderNumber = loaded.generateOrderNumber();
      console.log(`  - Generated order number: ${orderNumber}`);
      console.log(`  - Phone validation: ${loaded.validatePhone('+998901234567')}`);
    } else if (module.name === 'Error Types') {
      const error = new loaded.ValidationError('Test error');
      console.log(`  - ValidationError: ${error.name}`);
      console.log(`  - Status code: ${error.statusCode}`);
    } else if (module.name === 'Logger') {
      console.log(`  - Logger instance created`);
    }
  } catch (error) {
    console.error(`✗ ${module.name} failed to load`);
    console.error(`  Error: ${error.message}`);
    allPassed = false;
  }
}

console.log('\n=== Testing Helper Functions ===\n');

try {
  const helpers = require('./utils/helpers');
  
  const tests = [
    { name: 'Generate Order Number', fn: () => helpers.generateOrderNumber() },
    { name: 'Format Phone', fn: () => helpers.formatPhone('901234567') },
    { name: 'Format Currency', fn: () => helpers.formatCurrency(50000) },
    { name: 'Calculate Distance', fn: () => helpers.calculateDistance(41.2995, 69.2401, 41.3111, 69.2797) },
    { name: 'Format Distance', fn: () => helpers.formatDistance(1500) },
    { name: 'Calculate Delivery Fee', fn: () => helpers.calculateDeliveryFee(5.5) },
    { name: 'Calculate ETA', fn: () => helpers.calculateETA(10) },
    { name: 'Format Duration', fn: () => helpers.formatDuration(75) },
    { name: 'Paginate', fn: () => helpers.paginate(2, 20) }
  ];
  
  for (const test of tests) {
    try {
      const result = test.fn();
      console.log(`✓ ${test.name}: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error(`✗ ${test.name}: ${error.message}`);
      allPassed = false;
    }
  }
} catch (error) {
  console.error(`Failed to test helpers: ${error.message}`);
  allPassed = false;
}

console.log('\n=== Testing Error Classes ===\n');

try {
  const errors = require('./utils/errorTypes');
  
  const errorTests = [
    new errors.ValidationError('Test validation'),
    new errors.NotFoundError('Resource not found'),
    new errors.UnauthorizedError(),
    new errors.ForbiddenError(),
    new errors.ConflictError('Conflict'),
    new errors.BadRequestError()
  ];
  
  for (const error of errorTests) {
    console.log(`✓ ${error.name}: status=${error.statusCode}, code=${error.errorCode}`);
  }
} catch (error) {
  console.error(`Failed to test errors: ${error.message}`);
  allPassed = false;
}

console.log('\n=== Testing Constants ===\n');

try {
  const constants = require('./config/constants');
  
  console.log('Roles:', Object.values(constants.ROLES).join(', '));
  console.log('Order Statuses:', Object.values(constants.ORDER_STATUSES).join(', '));
  console.log('Payment Types:', Object.values(constants.PAYMENT_TYPES).join(', '));
  console.log('Payment Statuses:', Object.values(constants.PAYMENT_STATUSES).join(', '));
  console.log('Socket Events:', Object.keys(constants.SOCKET_EVENTS).length, 'events');
  console.log('HTTP Status Codes:', Object.keys(constants.HTTP_STATUS).length, 'codes');
} catch (error) {
  console.error(`Failed to test constants: ${error.message}`);
  allPassed = false;
}

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✓ All infrastructure tests passed!');
  process.exit(0);
} else {
  console.log('✗ Some tests failed!');
  process.exit(1);
}
