const express = require('express');
const router = express.Router();
const { usersController } = require('../controllers');
const { verifyToken, requireAdmin, validateBody, apiLimiter } = require('../../middleware');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');

router.get('/', verifyToken, requireAdmin, apiLimiter, usersController.getAllUsers);
router.get('/:id', verifyToken, requireAdmin, apiLimiter, usersController.getUserById);
router.post('/', verifyToken, requireAdmin, validateBody(createUserSchema), apiLimiter, usersController.createUser);
router.put('/:id', verifyToken, requireAdmin, validateBody(updateUserSchema), apiLimiter, usersController.updateUser);
router.delete('/:id', verifyToken, requireAdmin, apiLimiter, usersController.deleteUser);

module.exports = router;
