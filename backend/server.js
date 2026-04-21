// Express server setup for OpenBazar MVP
// Upgrade: Add HTTPS, strict CORS config, logging, monitoring, etc.
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Basic rate limiting
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
