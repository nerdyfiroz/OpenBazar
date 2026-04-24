// Express server setup for OpenBazar MVP
// Upgrade: Add HTTPS, strict CORS config, logging, monitoring, etc.
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://open-bazar.me',
  'https://www.open-bazar.me',
  'https://openbazar.onrender.com',
  'http://localhost:3000',
  'http://localhost:5000'
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/(.+\.)?open-bazar\.me$/.test(origin) ||
      /^https:\/\/(.+\.)?onrender\.com$/.test(origin);

    return isAllowed
      ? callback(null, true)
      : callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
});
app.use(limiter);

// Specific rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many auth attempts. Please wait and try again.' });
  }
});
app.use('/api/auth', authLimiter);

// Connect to MongoDB with retry logic
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const setupAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) return; // Silent skip if no admin configured

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = new User({
        name: 'System Admin',
        email: adminEmail,
        phone: '0000000000',
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
      await admin.save();
      console.log(`[Setup] Admin account generated for ${adminEmail}`);
    } else if (admin.email !== adminEmail) {
      // Update existing admin's email and password if changed in .env
      admin.email = adminEmail;
      admin.password = await bcrypt.hash(adminPassword, 10);
      await admin.save();
      console.log(`[Setup] Admin account updated to ${adminEmail}`);
    }
  } catch (err) {
    console.error('[Setup] Failed to seed admin:', err.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected');
    await setupAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying gracefully in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Product routes
app.use('/api/products', require('./routes/product'));

// Coupon routes
app.use('/api/coupons', require('./routes/coupon'));

// Order routes
app.use('/api/orders', require('./routes/order'));

// Payment routes
app.use('/api/payments', require('./routes/payment'));

// Dashboard routes
app.use('/api/dashboard', require('./routes/dashboard'));

// Invoice route
app.use('/api/invoice', require('./routes/invoice'));

app.get('/', (req, res) => res.send('OpenBazar API running'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Global Error]: ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
