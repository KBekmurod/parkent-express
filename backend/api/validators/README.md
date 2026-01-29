# Joi Validation Schemas - Parkent Express API

This directory contains comprehensive Joi validation schemas for all API endpoints in the Parkent Express delivery system.

## Files

### 1. user.validator.js
User-related validation schemas:

- **createUserSchema**: Validates new user creation
  - `phone`: +998XXXXXXXXX format (required)
  - `firstName`: 2-50 characters (required)
  - `lastName`: 2-50 characters (optional)
  - `role`: customer|vendor|courier|admin (default: customer)
  - `telegramId`: 5-15 digits (optional)
  - `telegramUsername`: 5-32 characters (optional)

- **updateUserSchema**: Validates user profile updates
  - All fields optional, minimum 1 field required
  
- **updateLocationSchema**: Validates user location updates
  - `latitude`: 41.25 - 41.35 (Parkent bounds)
  - `longitude`: 69.65 - 69.75 (Parkent bounds)
  - `address`: 5-200 characters
  - `addressUz`: 5-200 characters (optional)

### 2. order.validator.js
Order-related validation schemas:

- **createOrderSchema**: Validates new order creation
  - `customerId`: MongoDB ObjectId (required)
  - `vendorId`: MongoDB ObjectId (required)
  - `items`: Array of 1-50 items, each with:
    - `productId`: MongoDB ObjectId
    - `quantity`: 1-99
    - `price`: Positive number (optional)
    - `notes`: Max 200 characters (optional)
  - `deliveryLocation`: GeoJSON Point within Parkent bounds
  - `paymentType`: cash|card
  - `deliveryInstructions`: Max 500 characters (optional)
  - `contactPhone`: +998XXXXXXXXX format (optional)

- **updateOrderStatusSchema**: Validates order status changes
  - `status`: Validates against ORDER_STATUSES enum
  - Custom validation ensures valid status transitions using ORDER_STATUS_FLOW
  - `reason`: Required for cancellation, max 500 characters

- **assignCourierSchema**: Validates courier assignment
  - `courierId`: MongoDB ObjectId (required)
  - `estimatedPickupTime`: Future date (optional)
  - `estimatedDeliveryTime`: Future date (optional)

- **rateOrderSchema**: Validates order ratings
  - `rating`: 1-5 (required)
  - `vendorRating`: 1-5 (optional)
  - `courierRating`: 1-5 (optional)
  - `feedback`: Max 1000 characters (optional)
  - `vendorFeedback`: Max 1000 characters (optional)
  - `courierFeedback`: Max 1000 characters (optional)

### 3. product.validator.js
Product-related validation schemas:

- **createProductSchema**: Validates new product creation
  - `vendorId`: MongoDB ObjectId (required)
  - `name`: 2-100 characters (required)
  - `nameUz`: 2-100 characters (required)
  - `description`: 10-1000 characters (optional)
  - `price`: Positive, max 100,000,000 UZS (required)
  - `originalPrice`: Greater than price (optional)
  - `category`: One of 11 predefined categories (required)
  - `images`: Array of URIs, max 10 (optional)
  - `unit`: piece|kg|gram|liter|ml|pack|portion
  - `preparationTime`: 0-240 minutes (optional)
  - `isAvailable`: Boolean (default: true)
  - `isFeatured`: Boolean (default: false)
  - `tags`: Array of 2-30 char strings, max 20 (optional)
  - `nutritionInfo`: Object with calories, protein, carbs, fat (optional)
  - `allergens`: Array of predefined allergens (optional)
  - `stockQuantity`: Non-negative integer (optional)
  - `minOrderQuantity`: 1-99 (default: 1)
  - `maxOrderQuantity`: 1-99 (optional)

- **updateProductSchema**: Validates product updates
  - All fields optional, minimum 1 field required

- **updateAvailabilitySchema**: Validates availability changes
  - `isAvailable`: Boolean (required)
  - `reason`: Max 200 characters (optional)

**Product Categories**: food, beverages, grocery, bakery, dairy, meat, fruits, vegetables, snacks, desserts, other

### 4. vendor.validator.js
Vendor-related validation schemas:

- **createVendorSchema**: Validates new vendor creation
  - `name`: 2-100 characters (required)
  - `nameUz`: 2-100 characters (required)
  - `description`: 10-1000 characters (optional)
  - `location`: GeoJSON Point within Parkent bounds (required)
  - `phone`: +998XXXXXXXXX format (required)
  - `alternativePhone`: +998XXXXXXXXX format (optional)
  - `workingHours`: Object with all 7 days (required), each day has:
    - `isOpen`: Boolean
    - `openTime`: HH:MM format (24-hour, required if open)
    - `closeTime`: HH:MM format (24-hour, required if open)
  - `ownerId`: MongoDB ObjectId (required)
  - `logo`: URI (optional)
  - `coverImage`: URI (optional)
  - `categories`: Array of 1-10 categories (optional)
  - `minimumOrder`: 0-1,000,000 UZS (default: 0)
  - `deliveryFee`: 0-100,000 UZS (default: 0)
  - `estimatedDeliveryTime`: 10-180 minutes (optional)
  - `isActive`: Boolean (default: true)

- **updateVendorSchema**: Validates vendor updates
  - All fields optional, minimum 1 field required

- **workingHoursSchema**: Reusable schema for single day hours

### 5. courier.validator.js
Courier-related validation schemas:

- **createCourierSchema**: Validates new courier creation
  - `userId`: MongoDB ObjectId (required)
  - `vehicleType`: bicycle|motorcycle|car|scooter|foot (required)
  - `vehicleNumber`: 3-20 characters, uppercase (required for motorized)
  - `vehicleModel`: 2-50 characters (optional)
  - `vehicleColor`: 3-30 characters (optional)
  - `licenseNumber`: 5-20 characters, uppercase (required for motorcycle/car)
  - `licenseExpiry`: Future date (required with license)
  - `insuranceNumber`: 5-30 characters (optional)
  - `insuranceExpiry`: Future date (required with insurance)
  - `documents`: Object with URIs for idCard, license, etc. (optional)
  - `emergencyContact`: Object with name, phone, relationship (optional)
  - `isAvailable`: Boolean (default: false)
  - `isOnline`: Boolean (default: false)

- **updateLocationSchema**: Validates location updates
  - `latitude`: 41.25 - 41.35 (Parkent bounds, required)
  - `longitude`: 69.65 - 69.75 (Parkent bounds, required)
  - `heading`: 0-360 degrees (optional)
  - `speed`: 0-200 km/h (optional)
  - `accuracy`: Positive number (optional)

- **updateAvailabilitySchema**: Validates availability changes
  - `isAvailable`: Boolean (required)
  - `isOnline`: Boolean (required)
  - `reason`: Max 200 characters (optional)
  - Custom validation: Courier must be online to be available

- **updateCourierSchema**: Validates courier profile updates
  - All fields optional, minimum 1 field required

**Vehicle Types**: bicycle, motorcycle, car, scooter, foot

## Common Patterns

### Parkent City Bounds
All location validations use consistent Parkent city bounds:
- Latitude: 41.25 - 41.35
- Longitude: 69.65 - 69.75

### Phone Number Format
All phone validations use Uzbekistan format: `+998XXXXXXXXX`

### MongoDB ObjectId Pattern
All ID validations use regex: `/^[0-9a-fA-F]{24}$/`

### Custom Error Messages
All validators include comprehensive custom error messages for better API responses.

## Usage Example

```javascript
const { createUserSchema } = require('./validators/user.validator');

// Validate request body
const { error, value } = createUserSchema.validate(req.body);

if (error) {
  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors: error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }))
  });
}

// Use validated data
const user = await User.create(value);
```

## Testing

All validators have been tested with:
- Valid data scenarios
- Invalid data scenarios
- Edge cases (boundaries, patterns, conditional validations)
- Custom validation logic (status transitions, availability rules)

## Security Notes

- All validators passed CodeQL security scanning
- No vulnerabilities detected
- Input sanitization through Joi's built-in protections
- Proper bounds checking for all numeric inputs
- Pattern validation for sensitive fields (phone, IDs)

## Dependencies

- `joi` v17.11.0 or higher
- `../../config/constants.js` - Application constants

---

**Created**: January 29, 2024  
**Last Updated**: January 29, 2024
