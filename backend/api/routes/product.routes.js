const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const productValidator = require('../validators/product.validator');
const { authenticate, authorize, optionalAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validation');

router.post('/', authenticate, authorize('vendor', 'admin'), productValidator.createProductValidator, validate, productController.createProduct);
router.get('/search', optionalAuth, productValidator.searchProductsValidator, validate, productController.searchProducts);
router.get('/vendor/:vendorId', optionalAuth, productValidator.getVendorProductsValidator, validate, productController.getVendorProducts);
router.get('/', optionalAuth, productValidator.listProductsValidator, validate, productController.listProducts);
router.get('/:id', optionalAuth, productValidator.getProductValidator, validate, productController.getProduct);
router.put('/:id', authenticate, authorize('vendor', 'admin'), productValidator.updateProductValidator, validate, productController.updateProduct);
router.patch('/:id/availability', authenticate, authorize('vendor', 'admin'), productValidator.toggleProductAvailabilityValidator, validate, productController.toggleProductAvailability);
router.patch('/:id/stock', authenticate, authorize('vendor', 'admin'), productValidator.updateStockValidator, validate, productController.updateStock);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), productValidator.getProductValidator, validate, productController.deleteProduct);

module.exports = router;
