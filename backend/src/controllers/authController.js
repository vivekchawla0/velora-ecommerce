const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'velora_default_jwt_secret_dev_key';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password.',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // Assign role (only allow setting admin in development or if authorized, otherwise default to 'user')
    const assignedRole = role === 'admin' && process.env.NODE_ENV !== 'production' ? 'admin' : 'user';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      status: 'active',
      lastActivityAt: new Date(),
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

const mongoose = require('mongoose');

const demoShopperObj = {
  _id: '660000000000000000000001',
  id: '660000000000000000000001',
  name: 'Alex Morgan',
  email: 'demo@example.com',
  role: 'user',
  status: 'active',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  preferences: { favoriteCategories: ['electronics', 'gaming', 'workspace'] },
  createdAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
};

const demoAdminObj = {
  _id: '660000000000000000000002',
  id: '660000000000000000000002',
  name: 'Velora Administrator',
  email: 'admin@example.com',
  role: 'admin',
  status: 'active',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  preferences: { favoriteCategories: ['electronics', 'audio', 'workspace'] },
  createdAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
};

// @desc    Authenticate user & get JWT token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isDemoShopper = normalizedEmail === 'demo@example.com';
    const isDemoAdmin = normalizedEmail === 'admin@example.com';

    // Immediate 1-Click Demo Shortcut Failsafe
    if ((isDemoShopper || isDemoAdmin) && (password === 'password123' || password === 'Demo123!' || password === 'Admin123!')) {
      let userObj = isDemoAdmin ? demoAdminObj : demoShopperObj;

      if (mongoose.connection.readyState === 1) {
        try {
          let dbUser = await User.findOne({ email: normalizedEmail }).select('+password');
          if (!dbUser) {
            dbUser = await User.create({
              name: userObj.name,
              email: userObj.email,
              password: isDemoAdmin ? 'Admin123!' : 'Demo123!',
              role: userObj.role,
              status: 'active',
              avatar: userObj.avatar,
              preferences: userObj.preferences,
            });
          }
          if (dbUser) {
            userObj = {
              id: dbUser._id,
              _id: dbUser._id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role,
              status: dbUser.status,
              avatar: dbUser.avatar,
              preferences: dbUser.preferences,
            };
          }
        } catch (dbErr) {
          console.warn('[Auth Controller] Demo user DB query warning:', dbErr.message);
        }
      }

      const token = generateToken(userObj._id);
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: userObj,
      });
    }

    let user = null;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account status
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently blocked. Please contact support.',
      });
    }

    if (user.status === 'deleted') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last activity timestamp on login
    user.lastActivityAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(req.user._id);
      } catch (err) {
        // Fallthrough
      }
    }

    if (!user) {
      const uId = String(req.user._id || req.user.id);
      if (uId === '660000000000000000000001' || req.user.email === 'demo@example.com') {
        return res.status(200).json({ success: true, user: demoShopperObj });
      }
      if (uId === '660000000000000000000002' || req.user.email === 'admin@example.com') {
        return res.status(200).json({ success: true, user: demoAdminObj });
      }
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (user.status === 'deleted') {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastActivityAt: user.lastActivityAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & preferences
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.avatar) user.avatar = req.body.avatar;
    if (req.body.preferences) user.preferences = req.body.preferences;

    if (req.body.password) {
      user.password = req.body.password;
    }

    user.lastActivityAt = new Date();
    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        avatar: updatedUser.avatar,
        preferences: updatedUser.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};
