const crypto = require('crypto');
const { REGEX, DEFAULTS } = require('../config/constants');

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  return `PE${timestamp}`;
};

const generateUniqueCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
};

const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const formatPhone = (phone) => {
  if (!phone) return null;
  
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('998')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+998' + cleaned;
  }
  
  return cleaned;
};

const validatePhone = (phone) => {
  if (!phone) return false;
  
  const formatted = formatPhone(phone);
  return REGEX.PHONE.test(formatted);
};

const formatCurrency = (amount, currency = DEFAULTS.CURRENCY) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  return `${amount.toLocaleString('uz-UZ')} ${currency}`;
};

const formatDistance = (distanceInMeters) => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  }
  
  return `${(distanceInMeters / 1000).toFixed(1)} km`;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

const calculateDeliveryFee = (distance, baseRate = 5000, perKmRate = 1000) => {
  if (distance <= 2) {
    return baseRate;
  }
  
  const additionalDistance = distance - 2;
  const additionalFee = Math.ceil(additionalDistance) * perKmRate;
  
  return baseRate + additionalFee;
};

const calculateETA = (distance, speedKmH = 30) => {
  const timeInHours = distance / speedKmH;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  
  return timeInMinutes;
};

const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  
  return `${hours} h ${remainingMinutes} min`;
};

const formatDateTime = (date, timezone = DEFAULTS.TIMEZONE) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return date.toLocaleString('uz-UZ', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (date, timezone = DEFAULTS.TIMEZONE) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('uz-UZ', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const formatTime = (date, timezone = DEFAULTS.TIMEZONE) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return date.toLocaleTimeString('uz-UZ', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isExpired = (date, minutes) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const expirationTime = new Date(date.getTime() + minutes * 60000);
  return new Date() > expirationTime;
};

const addMinutes = (date, minutes) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return new Date(date.getTime() + minutes * 60000);
};

const generateHash = (data) => {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
};

const generateToken = (length = 32) => {
  return crypto
    .randomBytes(length)
    .toString('hex');
};

const sanitizeObject = (obj, allowedFields) => {
  const sanitized = {};
  
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      sanitized[field] = obj[field];
    }
  }
  
  return sanitized;
};

const removeEmptyFields = (obj) => {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

const paginate = (page, limit, maxLimit = 100) => {
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 20;
  
  if (page < 1) page = 1;
  if (limit < 1) limit = 20;
  if (limit > maxLimit) limit = maxLimit;
  
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    }
  };
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        await sleep(delay * attempt);
      }
    }
  }
  
  throw lastError;
};

const chunk = (array, size) => {
  const chunks = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
};

const unique = (array) => {
  return [...new Set(array)];
};

const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    
    if (!result[group]) {
      result[group] = [];
    }
    
    result[group].push(item);
    return result;
  }, {});
};

const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const truncate = (string, length = 100, suffix = '...') => {
  if (string.length <= length) {
    return string;
  }
  
  return string.substring(0, length - suffix.length) + suffix;
};

const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const randomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const percentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const roundToNearest = (value, nearest = 1000) => {
  return Math.round(value / nearest) * nearest;
};

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const maskPhone = (phone) => {
  if (!phone || phone.length < 4) return phone;
  
  const visiblePart = phone.slice(-4);
  const maskedPart = '*'.repeat(phone.length - 4);
  
  return maskedPart + visiblePart;
};

const maskEmail = (email) => {
  if (!email) return email;
  
  const [username, domain] = email.split('@');
  
  if (!username || !domain) return email;
  
  const visibleChars = Math.min(3, username.length);
  const masked = username.slice(0, visibleChars) + '***';
  
  return `${masked}@${domain}`;
};

module.exports = {
  generateOrderNumber,
  generateUniqueCode,
  generateRandomNumber,
  formatPhone,
  validatePhone,
  formatCurrency,
  formatDistance,
  calculateDistance,
  calculateDeliveryFee,
  calculateETA,
  formatDuration,
  formatDateTime,
  formatDate,
  formatTime,
  isExpired,
  addMinutes,
  generateHash,
  generateToken,
  sanitizeObject,
  removeEmptyFields,
  paginate,
  buildPaginationResponse,
  sleep,
  retry,
  chunk,
  unique,
  groupBy,
  sortBy,
  escapeRegex,
  truncate,
  capitalize,
  randomElement,
  percentage,
  clamp,
  roundToNearest,
  isValidObjectId,
  maskPhone,
  maskEmail
};
