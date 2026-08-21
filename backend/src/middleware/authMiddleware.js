const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: verifies JWT token from Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No authorization token provided.',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'velora_default_jwt_secret_dev_key';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.status === 'deleted') {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently blocked. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.',
    });
  }
};

/**
 * Authorize specific roles (e.g. 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

/**
 * Optional authentication: if token is present, attaches user to req, else proceeds as guest
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'velora_default_jwt_secret_dev_key';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.status !== 'deleted' && user.status !== 'blocked') {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };
