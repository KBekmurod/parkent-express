const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const orderValidator = require('../validators/order.validator');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validation');

router.post('/', authenticate, orderValidator.createOrderValidator, validate, orderController.createOrder);
router.get('/stats', authenticate, authorize('admin', 'vendor', 'courier'), orderController.getOrderStats);
router.get('/', authenticate, orderValidator.listOrdersValidator, validate, orderController.listOrders);
router.get('/:id', authenticate, orderValidator.getOrderValidator, validate, orderController.getOrder);
router.put('/:id/status', authenticate, orderValidator.updateOrderStatusValidator, validate, orderController.updateOrderStatus);
router.post('/:id/confirm', authenticate, authorize('vendor', 'admin'), orderValidator.getOrderValidator, validate, orderController.confirmOrder);
router.post('/:id/reject', authenticate, authorize('vendor', 'admin'), orderValidator.cancelOrderValidator, validate, orderController.rejectOrder);
router.post('/:id/assign', authenticate, authorize('admin'), orderValidator.assignCourierValidator, validate, orderController.assignCourier);
router.post('/:id/cancel', authenticate, orderValidator.cancelOrderValidator, validate, orderController.cancelOrder);
router.post('/:id/rate', authenticate, authorize('customer'), orderValidator.rateOrderValidator, validate, orderController.rateOrder);

module.exports = router;
