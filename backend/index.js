const express = require('express');
const cors = require('cors');
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const staffRoutes = require('./routes/staffRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const sharedCartRoutes = require('./routes/sharedCartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentSettingsRoutes = require('./routes/paymentSettingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const path = require('path');
require('dotenv').config();

const app = express();

// Update CORS configuration to use environment variables
const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:8081',
    'https://frontend-beta-coral.vercel.app',
    'https://frontend-mj39pf9dy-l4nszxcs-projects.vercel.app',
    'https://frontend-1bmz2c9lr-l4nszxcs-projects.vercel.app',
    'https://frontend-kxmpt26cd-l4nszxcs-projects.vercel.app',
    'https://frontend-oyxci34dt-l4nszxcs-projects.vercel.app',
    'https://frontend-jatiu7u2v-l4nszxcs-projects.vercel.app',
    'https://jm-garis-frontend.vercel.app' // backup domain
];

// Add debugging
console.log('🔧 CORS Origins configured:', allowedOrigins);

// Configure CORS properly for development
app.use(cors({
    origin: function (origin, callback) {
        console.log('🌐 CORS Request from origin:', origin);
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed origins or is a vercel.app domain
        if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
            console.log('✅ CORS: Origin allowed');
            callback(null, true);
        } else {
            console.log('❌ CORS: Origin blocked');
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200 // For legacy browser support
}));

// Configure express with larger limits for file uploads
// Only parse JSON when content-type is application/json
app.use(express.json({ 
    limit: '10mb',
    type: 'application/json'
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    type: 'application/x-www-form-urlencoded'
}));

// Session middleware with environment-based secret
app.use(session({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Health check and root route
app.get('/', (req, res) => {
    res.json({
        message: 'JM-Garis Backend API is running!',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/rewards', rewardRoutes);
app.use('/api/shared-cart', sharedCartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin/payment-settings', paymentSettingsRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 7904;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});