const orderService = require('../../services/orderService');
const { asyncHandler } = require('../../utils/helpers');
const { HTTP_STATUS } = require('../../utils/constants');

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.userId, req.body);
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { order }
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.userId, req.userRole);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { order }
  });
});

const listOrders = asyncHandler(async (req, res) => {
  const { status, isActive, page, limit } = req.query;
  
  const filters = { status };
  
  if (isActive !== undefined) {
    filters.isActive = isActive === 'true';
  }
  
  if (req.userRole === 'customer') {
    filters.customerId = req.userId;
  } else if (req.userRole === 'vendor') {
    const Vendor = require('../../models/Vendor');
    const vendor = await Vendor.findOne({ owner: req.userId });
    if (vendor) {
      filters.vendorId = vendor._id;
    }
  } else if (req.userRole === 'courier') {
    filters.courierId = req.userId;
  }
  
  const result = await orderService.listOrders(
    filters,
    parseInt(page) || 1,
    parseInt(limit) || 10
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  
  const order = await orderService.updateOrderStatus(
    req.params.id,
    status,
    req.userId,
    note
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { order }
  });
});

const confirmOrder = asyncHandler(async (req, res) => {
  const Vendor = require('../../models/Vendor');
  const vendor = await Vendor.findOne({ owner: req.userId });
  
  if (!vendor) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: { message: 'Vendor not found' }
    });
  }
  
  const order = await orderService.confirmOrder(req.params.id, vendor._id.toString());
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { order }
  });
});

const rejectOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const Vendor = require('../../models/Vendor');
  const vendor = await Vendor.findOne({ owner: req.userId });
  
  if (!vendor) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: { message: 'Vendor not found' }
    });
  }
  
  const order = await orderService.rejectOrder(req.params.id, vendor._id.toString(), reason);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { order }
  });
});

const assignCourier = asyncHandler(async (req, res) => {
  const { courierId } = req.body;
  
  const order = await orderService.assignCourier(req.params.id, courierId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { order }
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const order = await orderService.cancelOrder(req.params.id, req.userId, reason);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { order }
  });
});

const rateOrder = asyncHandler(async (req, res) => {
  const order = await orderService.rateOrder(req.params.id, req.userId, req.body);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { order }
  });
});

const getOrderStats = asyncHandler(async (req, res) => {
  const { vendorId, courierId, startDate, endDate } = req.query;
  
  const stats = await orderService.getOrderStats({
    vendorId,
    courierId,
    startDate,
    endDate
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { stats }
  });
});

module.exports = {
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
  confirmOrder,
  rejectOrder,
  assignCourier,
  cancelOrder,
  rateOrder,
  getOrderStats
};
