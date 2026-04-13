import jwt from 'jsonwebtoken';

/**
 * authenticate — verifies JWT access token from Authorization header.
 * Attaches req.user = { id, email } on success.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header',
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Access token has expired — please refresh',
      });
    }
    return res.status(401).json({
      error: 'InvalidToken',
      message: 'Access token is invalid',
    });
  }
};

/**
 * optionalAuth — same as authenticate but never blocks the request.
 * Useful for public routes that have optional personalization.
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
  } catch (_) {
    // silently ignore invalid token for optional routes
  }
  next();
};
