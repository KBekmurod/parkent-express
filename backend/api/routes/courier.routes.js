const express = require('express');
const router = express.Router();
const courierController = require('../controllers/courier.controller');
const courierValidator = require('../validators/courier.validator');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validation');

router.post('/register', authenticate, courierValidator.registerCourierValidator, validate, courierController.registerCourier);
router.get('/available', authenticate, authorize('admin'), courierValidator.findAvailableCouriersValidator, validate, courierController.findAvailableCouriers);
router.get('/profile', authenticate, authorize('courier', 'admin'), courierController.getMyCourierProfile);
router.get('/stats', authenticate, authorize('courier', 'admin'), courierController.getCourierStats);
router.get('/', authenticate, authorize('admin'), courierValidator.listCouriersValidator, validate, courierController.listCouriers);
router.get('/:id', authenticate, authorize('admin'), courierValidator.getCourierValidator, validate, courierController.getCourier);
router.put('/profile', authenticate, authorize('courier', 'admin'), courierValidator.updateCourierValidator, validate, courierController.updateCourier);
router.post('/location', authenticate, authorize('courier'), courierValidator.updateLocationValidator, validate, courierController.updateLocation);
router.post('/online', authenticate, authorize('courier'), courierController.goOnline);
router.post('/offline', authenticate, authorize('courier'), courierController.goOffline);
router.post('/:id/approve', authenticate, authorize('admin'), courierValidator.getCourierValidator, validate, courierController.approveCourier);
router.post('/:id/reject', authenticate, authorize('admin'), courierValidator.rejectCourierValidator, validate, courierController.rejectCourier);
router.post('/:id/suspend', authenticate, authorize('admin'), courierValidator.suspendCourierValidator, validate, courierController.suspendCourier);
router.post('/:id/verify-document', authenticate, authorize('admin'), courierValidator.verifyDocumentValidator, validate, courierController.verifyDocument);
router.post('/withdraw', authenticate, authorize('courier'), courierValidator.withdrawEarningsValidator, validate, courierController.withdrawEarnings);

module.exports = router;
