# JM Garis Store - E-commerce Platform

A full-stack e-commerce platform built with Vue.js frontend and Node.js backend, featuring order management, payment integration, and admin dashboard.

## Features

- **User Management**: Registration, login, profile management
- **Product Catalog**: Browse products with categories and search
- **Shopping Cart**: Add to cart, shared cart functionality
- **Order Management**: Place orders, track status, order history
- **Payment Integration**: GCash payment via PayMongo
- **Rewards System**: Loyalty points and discounts
- **Admin Dashboard**: Product management, order tracking, analytics
- **Staff Interface**: Order processing and management
- **Real-time Features**: Cart sharing, order status updates

## Tech Stack

### Frontend
- Vue.js 3
- Vue Router
- CSS3 with custom styling
- Font Awesome icons

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- Nodemailer for emails
- PayMongo for payments

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn package manager

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd JM-Garis-Store
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Copy the environment example file and configure:
```bash
cp .env.example .env
```

Edit `.env` file with your configurations:
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=capstone

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secret-key-here

# Email Configuration (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# PayMongo Configuration
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key
PAYMONGO_SECRET_KEY=sk_test_your_secret_key

# Frontend URL
FRONTEND_URL=http://localhost:8080

# Server Configuration
PORT=7904
NODE_ENV=development
```

### 3. Database Setup
1. Create MySQL database named `capstone`
2. Import the provided SQL schema
3. Configure database credentials in `.env`

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Running the Application

Start the backend server:
```bash
cd backend
npm start
```

Start the frontend development server:
```bash
cd frontend
npm run serve
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:7904

## Environment Configuration

### Required Environment Variables

#### Database
- `DB_HOST`: MySQL host (default: localhost)
- `DB_USER`: MySQL username (default: root)
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: Database name (default: capstone)

#### Authentication
- `JWT_SECRET`: Secret key for JWT tokens

#### Email Service
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app password

#### Payment Gateway
- `PAYMONGO_PUBLIC_KEY`: PayMongo public key
- `PAYMONGO_SECRET_KEY`: PayMongo secret key

#### Application
- `FRONTEND_URL`: Frontend application URL
- `PORT`: Backend server port (default: 7904)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/admin/products` - Create product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/user` - Get user orders
- `PUT /api/orders/:id/status` - Update order status

### Payment
- `POST /api/payment/gcash/create` - Create GCash payment
- `GET /api/payment/status/:orderId` - Check payment status

## Deployment

### Production Environment Setup

1. Set `NODE_ENV=production` in `.env`
2. Use secure database credentials
3. Configure HTTPS for secure cookies
4. Set up proper CORS origins
5. Use production PayMongo keys

### Security Considerations

- Never commit `.env` files to version control
- Use strong JWT secrets
- Enable HTTPS in production
- Regularly update dependencies
- Implement rate limiting for APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
