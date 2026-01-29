const express = require('express');
const router = express.Router();
const { vendorsController } = require('../controllers');
const { verifyToken, requireAdmin, requireVendorOrAdmin, validateBody, apiLimiter } = require('../../middleware');
const { createVendorSchema, updateVendorSchema } = require('../validators/vendor.validator');

router.get('/', verifyToken, apiLimiter, vendorsController.getAllVendors);
router.get('/:id', verifyToken, apiLimiter, vendorsController.getVendorById);
router.post('/', verifyToken, requireAdmin, validateBody(createVendorSchema), apiLimiter, vendorsController.createVendor);
router.put('/:id', verifyToken, requireVendorOrAdmin, validateBody(updateVendorSchema), apiLimiter, vendorsController.updateVendor);
router.put('/:id/toggle', verifyToken, requireAdmin, apiLimiter, vendorsController.toggleVendorStatus);

module.exports = router;
