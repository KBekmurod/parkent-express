const express = require('express');
const router = express.Router();
const { productsController } = require('../controllers');
const { verifyToken, requireVendor, validateBody, apiLimiter } = require('../../middleware');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');

router.get('/', verifyToken, apiLimiter, productsController.getAllProducts);
router.get('/:id', verifyToken, apiLimiter, productsController.getProductById);
router.post('/', verifyToken, requireVendor, validateBody(createProductSchema), apiLimiter, productsController.createProduct);
router.put('/:id', verifyToken, requireVendor, validateBody(updateProductSchema), apiLimiter, productsController.updateProduct);
router.delete('/:id', verifyToken, requireVendor, apiLimiter, productsController.deleteProduct);

module.exports = router;
