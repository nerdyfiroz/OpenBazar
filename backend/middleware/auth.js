// JWT Auth Middleware & Role Protection
// Upgrade: Add refresh tokens, 2FA, OAuth, etc.
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  authenticate: async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, auth denied' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'User not found' });
      if (req.user.isBlocked) return res.status(403).json({ message: 'User blocked' });
      next();
    } catch (err) {
      res.status(401).json({ message: 'Token invalid' });
    }
  },
  authorize: (roles = []) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  }
};
