const { body } = require('express-validator');

const registerValidator = [
  body('telegramId')
    .notEmpty().withMessage('Telegram ID is required')
    .isString().withMessage('Telegram ID must be a string'),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+998[0-9]{9}$/).withMessage('Invalid phone number format'),
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name must be max 50 characters'),
  body('role')
    .optional()
    .isIn(['customer', 'vendor', 'courier', 'admin']).withMessage('Invalid role')
];

const loginWithTelegramValidator = [
  body('telegramId')
    .notEmpty().withMessage('Telegram ID is required')
    .isString().withMessage('Telegram ID must be a string')
];

const loginWithPhoneValidator = [
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+998[0-9]{9}$/).withMessage('Invalid phone number format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isString().withMessage('Refresh token must be a string')
];

const verifyTokenValidator = [
  body('token')
    .notEmpty().withMessage('Token is required')
    .isString().withMessage('Token must be a string')
];

const changePasswordValidator = [
  body('oldPassword')
    .notEmpty().withMessage('Old password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('New password must be different from old password');
      }
      return true;
    })
];

const resetPasswordValidator = [
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+998[0-9]{9}$/).withMessage('Invalid phone number format'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

module.exports = {
  registerValidator,
  loginWithTelegramValidator,
  loginWithPhoneValidator,
  refreshTokenValidator,
  verifyTokenValidator,
  changePasswordValidator,
  resetPasswordValidator
};
