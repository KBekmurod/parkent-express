const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes');
const vendorRoutes = require('./vendor.routes');
const courierRoutes = require('./courier.routes');
const productRoutes = require('./product.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/vendors', vendorRoutes);
router.use('/couriers', courierRoutes);
router.use('/products', productRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date()
  });
});

module.exports = router;
