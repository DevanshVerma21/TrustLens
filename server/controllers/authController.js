import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL  = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ── Token helpers ─────────────────────────────────────────────────────────────

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

async function createRefreshToken(userId, ip, userAgent) {
  // Opaque random token stored in DB
  const rawToken = crypto.randomBytes(64).toString('hex');

  await RefreshToken.create({
    userId,
    token: rawToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    ip,
    userAgent,
  });

  return rawToken;
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, name = '' } = req.body;

    // Check uniqueness
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await User.create({ email, name, passwordHash });

    const accessToken  = signAccessToken(user);
    const refreshToken = await createRefreshToken(
      user._id,
      getClientIp(req),
      req.headers['user-agent']
    );

    console.log(`✅ [AUTH] New user registered: ${email}`);

    return res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      refreshToken,
      user: {
        id:         user._id,
        email:      user.email,
        name:       user.name,
        trustScore: user.trustScore,
        riskLevel:  user.riskLevel,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'InternalError', message: error.message });
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Generic message — don't reveal whether email exists
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid email or password',
      });
    }

    // Check account lock
    if (user.isLocked()) {
      const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        error: 'AccountLocked',
        message: `Account is temporarily locked. Try again in ${remaining} minute(s).`,
        lockedUntil: user.lockedUntil,
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await user.incLoginAttempts();
      const attemptsLeft = Math.max(0, 5 - user.loginAttempts);
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: attemptsLeft > 0
          ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`
          : 'Account has been locked due to too many failed attempts.',
      });
    }

    // Success — reset lock counter
    await user.resetLoginAttempts(getClientIp(req));

    // Revoke any existing refresh tokens for this user (single-session security)
    await RefreshToken.updateMany({ userId: user._id, revoked: false }, { revoked: true });

    const accessToken  = signAccessToken(user);
    const refreshToken = await createRefreshToken(
      user._id,
      getClientIp(req),
      req.headers['user-agent']
    );

    console.log(`🔑 [AUTH] Login: ${email}`);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id:         user._id,
        email:      user.email,
        name:       user.name,
        trustScore: user.trustScore,
        riskLevel:  user.riskLevel,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'InternalError', message: error.message });
  }
};

/**
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      revoked: false,
    });

    if (!tokenDoc) {
      return res.status(401).json({
        error: 'InvalidRefreshToken',
        message: 'Refresh token is invalid or has been revoked',
      });
    }

    if (tokenDoc.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'RefreshTokenExpired',
        message: 'Refresh token has expired — please log in again',
      });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user || user.accountStatus === 'suspended') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is suspended',
      });
    }

    // Token rotation — revoke old, issue new
    tokenDoc.revoked = true;
    await tokenDoc.save();

    const newAccessToken  = signAccessToken(user);
    const newRefreshToken = await createRefreshToken(
      user._id,
      getClientIp(req),
      req.headers['user-agent']
    );

    return res.json({
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'InternalError', message: error.message });
  }
};

/**
 * POST /api/auth/logout
 * Revokes the provided refresh token.
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.updateOne({ token: refreshToken }, { revoked: true });
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'InternalError', message: error.message });
  }
};

/**
 * GET /api/auth/me  (requires authenticate middleware)
 */
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -loginAttempts -lockedUntil');
    if (!user) return res.status(404).json({ error: 'NotFound', message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ error: 'InternalError', message: error.message });
  }
};
