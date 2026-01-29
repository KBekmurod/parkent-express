const vendorService = require('../../services/vendorService');
const { asyncHandler } = require('../../utils/helpers');
const { HTTP_STATUS } = require('../../utils/constants');

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.createVendor(req.userId, req.body);
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { vendor }
  });
});

const getVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { vendor }
  });
});

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendor(req.params.id, req.userId, req.body);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { vendor }
  });
});

const toggleVendorStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  
  const vendor = await vendorService.toggleVendorStatus(req.params.id, req.userId, isActive);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { vendor }
  });
});

const toggleAcceptOrders = asyncHandler(async (req, res) => {
  const { acceptsOrders } = req.body;
  
  const vendor = await vendorService.toggleAcceptOrders(req.params.id, req.userId, acceptsOrders);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { vendor }
  });
});

const listVendors = asyncHandler(async (req, res) => {
  const { category, isFeatured, isVerified, search, tags, sortBy, page, limit } = req.query;
  
  const filters = {
    category,
    isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
    isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
    search,
    tags: tags ? tags.split(',') : undefined,
    sortBy
  };
  
  const result = await vendorService.listVendors(
    filters,
    parseInt(page) || 1,
    parseInt(limit) || 10
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result
  });
});

const findNearbyVendors = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance, category } = req.query;
  
  const vendors = await vendorService.findNearbyVendors(
    parseFloat(longitude),
    parseFloat(latitude),
    parseFloat(maxDistance) || 10,
    { category }
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { vendors }
  });
});

const getVendorStats = asyncHandler(async (req, res) => {
  const stats = await vendorService.getVendorStats(req.params.id, req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats
  });
});

const verifyVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.verifyVendor(req.params.id, req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { vendor }
  });
});

const suspendVendor = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const vendor = await vendorService.suspendVendor(req.params.id, req.userId, reason);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { vendor }
  });
});

const deleteVendor = asyncHandler(async (req, res) => {
  const result = await vendorService.deleteVendor(req.params.id, req.userId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

module.exports = {
  createVendor,
  getVendor,
  updateVendor,
  toggleVendorStatus,
  toggleAcceptOrders,
  listVendors,
  findNearbyVendors,
  getVendorStats,
  verifyVendor,
  suspendVendor,
  deleteVendor
};
