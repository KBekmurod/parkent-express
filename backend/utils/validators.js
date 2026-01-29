const validator = require('validator');

const isValidPhone = (phone) => {
  const phoneRegex = /^\+998[0-9]{9}$/;
  return phoneRegex.test(phone);
};

const isValidTelegramId = (telegramId) => {
  return /^[0-9]+$/.test(telegramId);
};

const isValidEmail = (email) => {
  return validator.isEmail(email);
};

const isValidUrl = (url) => {
  return validator.isURL(url);
};

const isValidCoordinates = (longitude, latitude) => {
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const sanitizeString = (str) => {
  if (!str) return '';
  return validator.escape(validator.trim(str));
};

const normalizePhone = (phone) => {
  let normalized = phone.replace(/\s+/g, '');
  
  if (normalized.startsWith('998') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  if (!normalized.startsWith('+') && normalized.length === 9) {
    normalized = '+998' + normalized;
  }
  
  return normalized;
};

const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password && password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateOrderAmount = (amount, minAmount = 5000) => {
  if (typeof amount !== 'number' || amount < 0) {
    return { isValid: false, error: 'Invalid amount' };
  }
  
  if (amount < minAmount) {
    return { isValid: false, error: `Minimum order amount is ${minAmount}` };
  }
  
  return { isValid: true };
};

const validateLocation = (location) => {
  if (!location || typeof location !== 'object') {
    return { isValid: false, error: 'Invalid location object' };
  }
  
  if (!location.coordinates || !Array.isArray(location.coordinates)) {
    return { isValid: false, error: 'Invalid coordinates' };
  }
  
  const [longitude, latitude] = location.coordinates;
  
  if (!isValidCoordinates(longitude, latitude)) {
    return { isValid: false, error: 'Invalid coordinate values' };
  }
  
  return { isValid: true };
};

const validateWorkingHours = (workingHours) => {
  if (!Array.isArray(workingHours)) {
    return { isValid: false, error: 'Working hours must be an array' };
  }
  
  for (const schedule of workingHours) {
    if (schedule.day < 0 || schedule.day > 6) {
      return { isValid: false, error: 'Invalid day of week' };
    }
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(schedule.open) || !timeRegex.test(schedule.close)) {
      return { isValid: false, error: 'Invalid time format. Use HH:MM' };
    }
  }
  
  return { isValid: true };
};

module.exports = {
  isValidPhone,
  isValidTelegramId,
  isValidEmail,
  isValidUrl,
  isValidCoordinates,
  isValidObjectId,
  sanitizeString,
  normalizePhone,
  validatePassword,
  validateOrderAmount,
  validateLocation,
  validateWorkingHours
};
