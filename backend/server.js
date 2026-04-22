// Express server setup for OpenBazar MVP
// Upgrade: Add HTTPS, strict CORS config, logging, monitoring, etc.
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Basic rate limiting
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100 });
app.use(limiter);

// Specific rate limit for auth routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api/auth', authLimiter);

// Connect to MongoDB with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 
    });
    console.log('MongoDB connected');
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
