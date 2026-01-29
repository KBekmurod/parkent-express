const express = require('express');
const router = express.Router();
const { couriersController } = require('../controllers');
const { verifyToken, requireAdmin, requireCourier, requireCourierOrAdmin, validateBody, apiLimiter } = require('../../middleware');
const { createCourierSchema, updateCourierSchema, updateLocationSchema, updateAvailabilitySchema } = require('../validators/courier.validator');

router.get('/', verifyToken, apiLimiter, couriersController.getAllCouriers);
router.get('/:id', verifyToken, apiLimiter, couriersController.getCourierById);
router.post('/', verifyToken, requireAdmin, validateBody(createCourierSchema), apiLimiter, couriersController.createCourier);
router.put('/:id', verifyToken, requireCourierOrAdmin, validateBody(updateCourierSchema), apiLimiter, couriersController.updateCourier);
router.put('/:id/location', verifyToken, requireCourier, validateBody(updateLocationSchema), apiLimiter, couriersController.updateCourierLocation);
router.put('/:id/availability', verifyToken, requireCourier, validateBody(updateAvailabilitySchema), apiLimiter, couriersController.updateCourierAvailability);

module.exports = router;
