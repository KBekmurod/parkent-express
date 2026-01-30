const userService = require('../../services/userService');
const { asyncHandler } = require('../../utils/helpers');
const { HTTP_STATUS } = require('../../utils/constants');

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { user }
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.userId, req.body);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { user }
  });
});

const updateLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude, address } = req.body;
  
  const user = await userService.updateUserLocation(req.userId, longitude, latitude, address);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { user }
  });
});

const updateNotificationSettings = asyncHandler(async (req, res) => {
  const user = await userService.updateNotificationSettings(req.userId, req.body);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { user }
  });
});

const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats(req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { role, search, page, limit } = req.query;
  
  const result = await userService.listUsers(
    { role, search },
    parseInt(page) || 1,
    parseInt(limit) || 10
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result
  });
});

const deactivateUser = asyncHandler(async (req, res) => {
  const result = await userService.deactivateUser(req.params.id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

module.exports = {
  getUser,
  updateUser,
  updateLocation,
  updateNotificationSettings,
  getUserStats,
  listUsers,
  deactivateUser
};
