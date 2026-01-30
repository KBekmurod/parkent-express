const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validation');

router.get('/stats', authenticate, userController.getUserStats);
router.get('/', authenticate, authorize('admin'), userValidator.listUsersValidator, validate, userController.listUsers);
router.get('/:id', authenticate, userValidator.getUserValidator, validate, userController.getUser);
router.put('/profile', authenticate, userValidator.updateUserValidator, validate, userController.updateUser);
router.put('/location', authenticate, userValidator.updateLocationValidator, validate, userController.updateLocation);
router.put('/notifications', authenticate, userValidator.updateNotificationSettingsValidator, validate, userController.updateNotificationSettings);
router.delete('/:id', authenticate, authorize('admin'), userValidator.getUserValidator, validate, userController.deactivateUser);

module.exports = router;
