const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const vendorValidator = require('../validators/vendor.validator');
const { authenticate, authorize, optionalAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validation');

router.post('/', authenticate, authorize('vendor', 'admin'), vendorValidator.createVendorValidator, validate, vendorController.createVendor);
router.get('/nearby', optionalAuth, vendorValidator.findNearbyVendorsValidator, validate, vendorController.findNearbyVendors);
router.get('/', optionalAuth, vendorValidator.listVendorsValidator, validate, vendorController.listVendors);
router.get('/:id/stats', authenticate, authorize('vendor', 'admin'), vendorValidator.getVendorValidator, validate, vendorController.getVendorStats);
router.get('/:id', optionalAuth, vendorValidator.getVendorValidator, validate, vendorController.getVendor);
router.put('/:id', authenticate, authorize('vendor', 'admin'), vendorValidator.updateVendorValidator, validate, vendorController.updateVendor);
router.patch('/:id/status', authenticate, authorize('vendor', 'admin'), vendorValidator.toggleVendorStatusValidator, validate, vendorController.toggleVendorStatus);
router.patch('/:id/accept-orders', authenticate, authorize('vendor', 'admin'), vendorValidator.toggleAcceptOrdersValidator, validate, vendorController.toggleAcceptOrders);
router.post('/:id/verify', authenticate, authorize('admin'), vendorValidator.getVendorValidator, validate, vendorController.verifyVendor);
router.post('/:id/suspend', authenticate, authorize('admin'), vendorValidator.suspendVendorValidator, validate, vendorController.suspendVendor);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), vendorValidator.getVendorValidator, validate, vendorController.deleteVendor);

module.exports = router;
