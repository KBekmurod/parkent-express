const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validation');

router.post('/register', authValidator.registerValidator, validate, authController.register);
router.post('/login/telegram', authValidator.loginWithTelegramValidator, validate, authController.loginWithTelegram);
router.post('/login/phone', authValidator.loginWithPhoneValidator, validate, authController.loginWithPhone);
router.post('/refresh-token', authValidator.refreshTokenValidator, validate, authController.refreshToken);
router.post('/verify-token', authValidator.verifyTokenValidator, validate, authController.verifyToken);
router.post('/change-password', authenticate, authValidator.changePasswordValidator, validate, authController.changePassword);
router.post('/reset-password', authValidator.resetPasswordValidator, validate, authController.resetPassword);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
