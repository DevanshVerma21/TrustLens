import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array().map((e) => e.msg).join(', '),
    });
  }
};

// POST: Register new user
router.post(
  '/register',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  async (req, res, next) => {
    try {
      handleValidationErrors(req, res);

      const { email, password, name } = req.body;

      // Check if user exists
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcryptjs.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        passwordHash,
        name,
        trustScore: 50, // Initial trust score
      });

      // Generate tokens
      const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '15m',
      });

      const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            trustScore: user.trustScore,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST: Login
router.post(
  '/login',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    try {
      handleValidationErrors(req, res);

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await bcryptjs.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '15m',
      });

      const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            trustScore: user.trustScore,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST: Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'No refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    res.status(403).json({ success: false, error: 'Invalid refresh token' });
  }
});

// POST: Logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

// GET: Current user (protected)
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          trustScore: user.trustScore,
          accountStatus: user.accountStatus,
          riskLevel: user.riskLevel,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
