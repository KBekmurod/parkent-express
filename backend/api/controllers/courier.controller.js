const courierService = require('../../services/courierService');
const { asyncHandler } = require('../../utils/helpers');
const { HTTP_STATUS } = require('../../utils/constants');

const registerCourier = asyncHandler(async (req, res) => {
  const courier = await courierService.registerCourier(req.userId, req.body);
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { courier }
  });
});

const getCourier = asyncHandler(async (req, res) => {
  const courier = await courierService.getCourierById(req.params.id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const getMyCourierProfile = asyncHandler(async (req, res) => {
  const courier = await courierService.getCourierByUserId(req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const updateCourier = asyncHandler(async (req, res) => {
  const courier = await courierService.updateCourier(req.userId, req.body);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const updateLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude, accuracy, heading, speed } = req.body;
  
  const courier = await courierService.updateLocation(
    req.userId,
    longitude,
    latitude,
    accuracy,
    heading,
    speed
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const goOnline = asyncHandler(async (req, res) => {
  const courier = await courierService.goOnline(req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const goOffline = asyncHandler(async (req, res) => {
  const courier = await courierService.goOffline(req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const listCouriers = asyncHandler(async (req, res) => {
  const { status, isOnline, isAvailable, vehicleType, page, limit } = req.query;
  
  const filters = {
    status,
    isOnline: isOnline === 'true' ? true : isOnline === 'false' ? false : undefined,
    isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
    vehicleType
  };
  
  const result = await courierService.listCouriers(
    filters,
    parseInt(page) || 1,
    parseInt(limit) || 10
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result
  });
});

const findAvailableCouriers = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance } = req.query;
  
  const couriers = await courierService.findAvailableCouriers(
    parseFloat(longitude),
    parseFloat(latitude),
    parseFloat(maxDistance) || 10
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { couriers }
  });
});

const approveCourier = asyncHandler(async (req, res) => {
  const courier = await courierService.approveCourier(req.params.id, req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const rejectCourier = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const courier = await courierService.rejectCourier(req.params.id, req.userId, reason);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const suspendCourier = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const courier = await courierService.suspendCourier(req.params.id, req.userId, reason);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const verifyDocument = asyncHandler(async (req, res) => {
  const { documentType } = req.body;
  
  const courier = await courierService.verifyDocument(req.params.id, documentType, req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

const getCourierStats = asyncHandler(async (req, res) => {
  const stats = await courierService.getCourierStats(req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats
  });
});

const withdrawEarnings = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  
  const courier = await courierService.withdrawEarnings(req.userId, amount);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { courier }
  });
});

module.exports = {
  registerCourier,
  getCourier,
  getMyCourierProfile,
  updateCourier,
  updateLocation,
  goOnline,
  goOffline,
  listCouriers,
  findAvailableCouriers,
  approveCourier,
  rejectCourier,
  suspendCourier,
  verifyDocument,
  getCourierStats,
  withdrawEarnings
};
