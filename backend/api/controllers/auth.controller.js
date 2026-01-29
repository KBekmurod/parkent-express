const authService = require('../../services/authService');
const { asyncHandler } = require('../../utils/helpers');
const { HTTP_STATUS } = require('../../utils/constants');

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: result
  });
});

const loginWithTelegram = asyncHandler(async (req, res) => {
  const { telegramId } = req.body;
  
  const result = await authService.loginWithTelegram(telegramId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

const loginWithPhone = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  
  const result = await authService.loginWithPhone(phone, password);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  const result = await authService.refreshToken(refreshToken);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

const verifyToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  const user = await authService.verifyToken(token);
  
  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: { message: 'Invalid token' }
    });
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { user }
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  const result = await authService.changePassword(req.userId, oldPassword, newPassword);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { phone, newPassword } = req.body;
  
  const result = await authService.resetPassword(phone, newPassword);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { user: req.user.toSafeObject() }
  });
});

module.exports = {
  register,
  loginWithTelegram,
  loginWithPhone,
  refreshToken,
  verifyToken,
  changePassword,
  resetPassword,
  getProfile
};
