import express from 'express';
import { register, login, refresh, logout, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/authSchemas.js';

const router = express.Router();

// Apply strict rate limiting to all auth routes
router.use(authRateLimiter);

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), refresh);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me  — requires valid access token
router.get('/me', authenticate, me);

export default router;
