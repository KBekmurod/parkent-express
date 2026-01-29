const express = require('express');
const router = express.Router();
const { ordersController } = require('../controllers');
const { verifyToken, requireAdmin, validateBody, apiLimiter, orderLimiter } = require('../../middleware');
const { createOrderSchema, updateOrderStatusSchema, assignCourierSchema, rateOrderSchema } = require('../validators/order.validator');

router.get('/', verifyToken, apiLimiter, ordersController.getAllOrders);
router.get('/:id', verifyToken, apiLimiter, ordersController.getOrderById);
router.post('/', verifyToken, validateBody(createOrderSchema), orderLimiter, ordersController.createOrder);
router.put('/:id/status', verifyToken, validateBody(updateOrderStatusSchema), apiLimiter, ordersController.updateOrderStatus);
router.put('/:id/assign', verifyToken, requireAdmin, validateBody(assignCourierSchema), apiLimiter, ordersController.assignCourier);
router.put('/:id/cancel', verifyToken, apiLimiter, ordersController.cancelOrder);
router.put('/:id/rate', verifyToken, validateBody(rateOrderSchema), apiLimiter, ordersController.rateOrder);

module.exports = router;
