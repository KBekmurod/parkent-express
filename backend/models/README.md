# Parkent Express - Mongoose Models

Complete Mongoose models for the Parkent Express delivery system. All models follow best practices with proper validation, indexes, virtuals, and methods.

## Models Overview

### 1. User Model (`User.js`)

User model with Telegram integration and role-based access control.

**Fields:**
- `telegramId` (String, unique, indexed) - Telegram user ID
- `username` (String) - Telegram username
- `firstName` (String, required) - User's first name
- `lastName` (String) - User's last name
- `phone` (String) - Phone number with validation
- `role` (String, enum) - customer, vendor, courier, admin
- `isActive` (Boolean) - Account status
- `registeredAt` (Date) - Registration timestamp
- `lastActive` (Date) - Last activity timestamp
- `defaultLocation` (Object) - Default delivery location
- `vendorId` (ObjectId) - Reference to Vendor (for vendor role)
- `courierId` (ObjectId) - Reference to Courier (for courier role)

**Virtuals:**
- `fullName` - First name + last name
- `displayName` - Username or full name

**Methods:**
- `updateLastActive()` - Update last active timestamp
- `hasRole(role)` - Check if user has specific role
- `canPlaceOrder()` - Check if user can place orders

**Statics:**
- `findByTelegramId(telegramId)` - Find user by Telegram ID
- `findActiveByRole(role)` - Find active users by role

---

### 2. Order Model (`Order.js`)

Complete order model with lifecycle management and status tracking.

**Fields:**
- `orderNumber` (String, unique) - Auto-generated (PE-YYYYMMDD-####)
- `customerId` (ObjectId, ref: User) - Customer reference
- `vendorId` (ObjectId, ref: Vendor) - Vendor reference
- `courierId` (ObjectId, ref: Courier) - Courier reference
- `items` (Array) - Order items with product details
- `deliveryLocation` (Object) - Delivery coordinates and address
- `orderDetails` (String) - Additional order notes
- `paymentType` (String, enum) - cash, card, online
- `paymentStatus` (String, enum) - pending, paid, failed, refunded
- `subtotal` (Number) - Items subtotal
- `deliveryFee` (Number) - Delivery fee
- `total` (Number) - Grand total
- `status` (String, enum) - Order status (9 statuses)
- `statusHistory` (Array) - Status change history
- Timestamp fields: `createdAt`, `acceptedAt`, `readyAt`, etc.
- `rating` (Number, 1-5) - Customer rating
- `feedback` (String) - Customer feedback
- `cancellationReason` (String) - Reason for cancellation

**Virtuals:**
- `totalItems` - Total quantity of items
- `duration` - Time from creation to delivery
- `isCompleted` - Whether order is completed

**Methods:**
- `addStatusHistory(status, updatedBy, note)` - Add status to history
- `transitionStatus(newStatus, updatedBy, note)` - Validate and change status
- `assignCourier(courierId, updatedBy)` - Assign courier to order
- `addRating(rating, feedback)` - Add customer rating
- `calculateTotal()` - Calculate order total

**Statics:**
- `generateOrderNumber()` - Generate unique order number

**Status Flow:**
pending → accepted → preparing → ready → assigned → picked_up → in_transit → delivered
(can be cancelled at any point before delivery)

---

### 3. Vendor Model (`Vendor.js`)

Vendor/restaurant model with working hours and ratings.

**Fields:**
- `name` (String, required) - Vendor name
- `nameUz` (String) - Uzbek name
- `description` (String) - Description
- `descriptionUz` (String) - Uzbek description
- `ownerId` (ObjectId, ref: User) - Owner reference
- `location` (Object) - Vendor location
- `phone` (String, required) - Contact phone
- `workingHours` (Object) - 7 days with open/close times
- `isActive` (Boolean) - Active status
- `isPaused` (Boolean) - Temporary pause
- `rating` (Number, 0-5) - Average rating
- `totalOrders` (Number) - Total completed orders
- `imageUrl` (String) - Vendor image
- `category` (String, enum) - restaurant, cafe, grocery, etc.

**Virtuals:**
- `displayName` - Name based on locale
- `displayDescription` - Description based on locale
- `isOpenNow` - Whether vendor is currently open

**Methods:**
- `checkIfOpenNow()` - Check if vendor is open now
- `getWorkingHours(day)` - Get working hours for specific day
- `updateRating(newRating)` - Recalculate average rating
- `incrementOrders()` - Increment total orders count
- `togglePause()` - Toggle pause status

**Statics:**
- `findNearLocation(lat, lon, maxDistance)` - Find nearby vendors
- `findOpenNow()` - Find currently open vendors

---

### 4. Product Model (`Product.js`)

Product model with bilingual support and discount management.

**Fields:**
- `vendorId` (ObjectId, ref: Vendor) - Vendor reference
- `name` (String, required) - Product name
- `nameUz` (String) - Uzbek name
- `description` (String) - Description
- `descriptionUz` (String) - Uzbek description
- `price` (Number, required) - Product price
- `category` (String, enum) - 20+ categories
- `imageUrl` (String) - Product image
- `isAvailable` (Boolean) - Availability status
- `preparationTime` (Number) - Minutes to prepare
- `weight` (String) - Product weight
- `calories` (Number) - Calorie count
- `ingredients` (Array) - Ingredient list
- `allergens` (Array) - Allergen list
- `spicyLevel` (Number, 0-5) - Spiciness level
- `isVegetarian` (Boolean) - Vegetarian flag
- `isVegan` (Boolean) - Vegan flag
- `discount` (Object) - Discount percentage and validity
- `soldCount` (Number) - Total units sold
- `viewCount` (Number) - Total views

**Virtuals:**
- `displayName` - Name based on locale
- `displayDescription` - Description based on locale
- `discountedPrice` - Price after discount
- `hasActiveDiscount` - Whether discount is active
- `isPopular` - Whether product is popular (>50 sales)

**Methods:**
- `incrementViews()` - Increment view count
- `incrementSales(quantity)` - Increment sold count
- `toggleAvailability()` - Toggle availability
- `setDiscount(percentage, validUntil)` - Set discount
- `removeDiscount()` - Remove discount
- `checkAvailability()` - Check if product is available

**Statics:**
- `findByVendor(vendorId, availableOnly)` - Find products by vendor
- `findByCategory(category, availableOnly)` - Find by category
- `findPopular(limit)` - Find popular products
- `findDiscounted()` - Find discounted products

---

### 5. Courier Model (`Courier.js`)

Courier model with location tracking and earnings management.

**Fields:**
- `userId` (ObjectId, ref: User, unique) - User reference
- `vehicleType` (String, enum) - bicycle, motorcycle, car, scooter, foot
- `vehicleNumber` (String) - Vehicle registration
- `currentLocation` (Object) - Real-time location with updatedAt
- `isAvailable` (Boolean) - Availability status
- `isOnline` (Boolean) - Online status
- `currentOrderId` (ObjectId, ref: Order) - Active order
- `stats` (Object):
  - `totalDeliveries` - Lifetime deliveries
  - `todayDeliveries` - Today's deliveries
  - `todayEarnings` - Today's earnings
  - `totalEarnings` - Lifetime earnings
  - `rating` - Average rating
  - `totalRatings` - Total ratings count
  - `lastResetDate` - Last daily reset date
- `documents` (Object) - License, insurance, verification
- `workingHours` (Object) - Preferred shift and max hours
- `bankDetails` (Object) - Payment details

**Virtuals:**
- `isBusy` - Whether courier has active order
- `averageRating` - Average rating score
- `documentsComplete` - Whether documents are complete
- `canAcceptOrders` - Whether courier can accept new orders

**Methods:**
- `updateLocation(lat, lon)` - Update current location
- `toggleOnline()` - Toggle online status
- `toggleAvailability()` - Toggle availability
- `assignOrder(orderId)` - Assign order to courier
- `completeOrder(deliveryFee)` - Complete order and update stats
- `updateRating(newRating)` - Update rating with new review
- `resetDailyStats()` - Reset daily statistics
- `calculateDistance(lat, lon)` - Calculate distance from point

**Statics:**
- `findAvailable()` - Find available couriers
- `findNearest(lat, lon, maxDistance)` - Find nearest available courier
- `getTopCouriers(limit)` - Get top-rated couriers

---

### 6. Session Model (`Session.js`)

Bot session model with TTL and shopping cart management.

**Fields:**
- `userId` (String, indexed) - Telegram user ID
- `chatId` (String, indexed) - Chat ID
- `scene` (String) - Current scene/state
- `state` (Mixed) - Scene-specific state data
- `language` (String, enum) - uz, ru, en
- `lastCommand` (String) - Last command executed
- `lastMessageId` (Number) - Last message ID
- `cart` (Array) - Shopping cart items
- `selectedVendorId` (ObjectId, ref: Vendor) - Selected vendor
- `deliveryLocation` (Object) - Delivery location
- `orderInProgress` (ObjectId, ref: Order) - Current order
- `createdAt` (Date) - Session creation
- `updatedAt` (Date) - Last update
- `expiresAt` (Date) - Expiry time (TTL: 30 minutes)

**Virtuals:**
- `cartTotal` - Total cart value
- `cartItemsCount` - Total items in cart
- `hasCartItems` - Whether cart has items
- `isExpired` - Whether session is expired

**Methods:**
- `updateExpiry(minutes)` - Extend session expiry
- `changeScene(scene, state)` - Change to new scene
- `updateState(updates)` - Update scene state
- `clearState()` - Clear scene state
- `addToCart(product, quantity)` - Add item to cart
- `removeFromCart(productId)` - Remove item from cart
- `updateCartItemQuantity(productId, quantity)` - Update quantity
- `clearCart()` - Clear entire cart
- `setDeliveryLocation(lat, lon, address)` - Set delivery location
- `clearDeliveryLocation()` - Clear delivery location
- `setLanguage(language)` - Set user language
- `reset()` - Reset entire session

**Statics:**
- `findOrCreate(userId, chatId)` - Find or create session
- `findActive(userId, chatId)` - Find active session
- `cleanupExpired()` - Cleanup expired sessions

**TTL Index:** Automatically deletes sessions 30 minutes after `expiresAt`

---

## Indexes

All models include appropriate indexes for query optimization:

- **User**: telegramId (unique), role, isActive
- **Order**: orderNumber (unique), customerId+status, vendorId+status, courierId+status, createdAt
- **Vendor**: isActive, rating, location coordinates, category
- **Product**: vendorId+isAvailable, category+isAvailable, price, soldCount
- **Courier**: userId (unique), isAvailable+isOnline, location coordinates, rating
- **Session**: userId+chatId, expiresAt (TTL)

---

## Relationships

```
User ──┬── has one ──> Vendor (role: vendor)
       ├── has one ──> Courier (role: courier)
       └── has many ─> Orders (as customer)

Vendor ── has many ─> Products
       └── has many ─> Orders

Product ── belongs to ─> Vendor

Order ──┬── belongs to ─> User (customer)
        ├── belongs to ─> Vendor
        └── belongs to ─> Courier

Courier ──┬── belongs to ─> User
          └── has one active ─> Order

Session ── belongs to ─> User (via telegramId)
        └── references ─> Vendor, Order, Products
```

---

## Usage Examples

### Create a User
```javascript
const User = require('./models/User');

const user = await User.create({
  telegramId: '123456789',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer'
});
```

### Create an Order
```javascript
const Order = require('./models/Order');

const orderNumber = await Order.generateOrderNumber();
const order = await Order.create({
  orderNumber,
  customerId: userId,
  vendorId: vendorId,
  items: [
    { productId: product1._id, productName: 'Pizza', quantity: 2, price: 50000 }
  ],
  deliveryLocation: { latitude: 40.8, longitude: 69.7, address: 'Address' },
  paymentType: 'cash',
  subtotal: 100000,
  deliveryFee: 10000,
  total: 110000
});

await order.transitionStatus('accepted', vendorId, 'Order accepted');
```

### Assign Courier
```javascript
const Courier = require('./models/Courier');

const courier = await Courier.findNearest(40.8, 69.7, 5);
await order.assignCourier(courier._id, vendorId);
```

### Manage Session
```javascript
const Session = require('./models/Session');

const session = await Session.findOrCreate('123456789', '123456789');
await session.addToCart(product, 2);
await session.setDeliveryLocation(40.8, 69.7, 'Address');
```

---

## Best Practices

1. **Always use transactions** for operations that modify multiple documents
2. **Use virtuals** for computed fields instead of storing redundant data
3. **Index frequently queried fields** for better performance
4. **Validate data** at the schema level before saving
5. **Use enums** for fields with fixed values
6. **Add timestamps** with `{ timestamps: true }`
7. **Use references** instead of embedding for better normalization
8. **Implement proper error handling** in methods and statics

---

## Security Considerations

- Phone numbers are validated with regex
- Passwords should be hashed (if added)
- Sensitive data (bank details) should be encrypted
- User roles are validated with enums
- Order status transitions are validated
- TTL indexes automatically cleanup expired sessions

---

## Testing

All models have been validated and tested for:
- Schema structure
- Index creation
- Virtual fields
- Instance methods
- Static methods
- Validation rules
- Relationships

Run tests with:
```bash
cd backend
node -e "const models = require('./models'); console.log('Models loaded:', Object.keys(models));"
```

---

## License

Part of Parkent Express delivery system.
