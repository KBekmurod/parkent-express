const express = require('express');
const router = express.Router();
const { statsController } = require('../controllers');
const { verifyToken, requireAdmin, requireVendorOrAdmin, requireCourierOrAdmin, apiLimiter } = require('../../middleware');

router.get('/dashboard', verifyToken, requireAdmin, apiLimiter, statsController.getDashboardStats);
router.get('/vendor/:vendorId', verifyToken, requireVendorOrAdmin, apiLimiter, statsController.getVendorStats);
router.get('/courier/:courierId', verifyToken, requireCourierOrAdmin, apiLimiter, statsController.getCourierStats);
router.get('/revenue', verifyToken, requireAdmin, apiLimiter, statsController.getRevenueStats);

module.exports = router;
