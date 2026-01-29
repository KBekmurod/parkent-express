# Parkent Express - Admin Panel

Full-featured Next.js 14 admin dashboard for managing the Parkent Express delivery system.

## Features

- 📊 **Dashboard**: Real-time statistics and analytics
- 📦 **Order Management**: View, filter, and manage all orders
- 🏪 **Vendor Management**: Add, edit, and manage vendors
- 🚴 **Courier Management**: Track couriers and assign deliveries
- 👥 **Customer Management**: View customer profiles and order history
- 📈 **Statistics**: Detailed performance metrics with charts
- ⚙️ **Settings**: Configure system parameters
- 🔄 **Real-time Updates**: Socket.io integration for live updates
- 🔐 **Authentication**: Secure admin login with JWT

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components (shadcn/ui style)
- **Forms**: React Hook Form + Zod validation
- **API Client**: Axios
- **Real-time**: Socket.io Client
- **Charts**: Recharts
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- Backend API running on `http://localhost:5000`
- npm or yarn

## Installation

1. Navigate to the admin-panel directory:
```bash
cd admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
admin-panel/
├── app/                    # Next.js 14 app directory
│   ├── (auth)/            # Authentication routes
│   │   └── login/         # Login page
│   ├── (dashboard)/       # Dashboard routes (protected)
│   │   ├── orders/        # Order management
│   │   ├── vendors/       # Vendor management
│   │   ├── couriers/      # Courier management
│   │   ├── customers/     # Customer management
│   │   ├── statistics/    # Analytics
│   │   └── settings/      # Settings
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── orders/           # Order-related components
│   ├── vendors/          # Vendor-related components
│   ├── couriers/         # Courier-related components
│   ├── charts/           # Chart components
│   └── common/           # Common components
├── contexts/             # React contexts
│   ├── AuthContext.jsx   # Authentication context
│   └── SocketContext.jsx # Socket.io context
├── hooks/                # Custom React hooks
│   ├── useAuth.js        # Authentication hook
│   ├── useOrders.js      # Orders hook
│   ├── useVendors.js     # Vendors hook
│   ├── useCouriers.js    # Couriers hook
│   └── useRealtime.js    # Real-time updates hook
├── lib/                  # Utility functions
│   ├── api.js           # Axios instance
│   ├── socket.js        # Socket.io client
│   ├── auth.js          # Auth utilities
│   └── utils.js         # Helper functions
└── public/              # Static files
```

## Key Features

### Dashboard
- Real-time statistics (orders, revenue, active vendors/couriers)
- Revenue chart for last 7 days
- Recent orders list
- Top vendors ranking

### Order Management
- Advanced filtering (status, date range, search)
- Real-time order updates
- Assign couriers to orders
- Cancel orders
- View detailed order information

### Vendor Management
- Add new vendors with form validation
- Edit vendor details
- Toggle vendor active status
- View vendor products
- View vendor order history
- Vendor statistics

### Courier Management
- Register new couriers
- Track courier locations on map (placeholder)
- View courier delivery history
- Toggle courier active status
- Real-time courier location updates

### Customer Management
- View all customers
- Search customers
- View customer order history
- Customer statistics

### Statistics
- Date range filtering
- Orders and revenue charts
- Performance metrics
- Top products

### Settings
- Configure delivery fee
- Set delivery radius
- Minimum order amount
- System name and support phone
- Notification settings

## API Integration

The admin panel connects to the backend API endpoints:

- `POST /api/auth/admin/login` - Admin login
- `GET /api/orders` - Fetch orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `GET /api/vendors` - Fetch vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `GET /api/couriers` - Fetch couriers
- `POST /api/couriers` - Create courier
- `GET /api/customers` - Fetch customers
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/statistics/*` - Various statistics endpoints
- `GET/PUT /api/settings` - System settings

## Real-time Features

Socket.io events:
- `new_order` - New order created
- `order_updated` - Order status changed
- `courier_location` - Courier location updated
- `vendor_updated` - Vendor information changed
- `courier_updated` - Courier information changed

## Authentication

Login with:
- Telegram ID
- Password

JWT token is stored in localStorage and automatically attached to API requests.

## Default Admin Credentials

Contact system administrator for admin credentials.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - Parkent Express

## Support

For support, contact the development team.
