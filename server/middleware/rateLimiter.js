import rateLimit from 'express-rate-limit';

/**
 * Standard 429 response formatter
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'TooManyRequests',
    message: 'You have exceeded the request limit. Please try again later.',
    retryAfter: Math.ceil(res.getHeader('Retry-After') / 60) + ' minutes',
  });
};

/**
 * authRateLimiter — Strict limiter for authentication endpoints.
 * Prevents brute-force attacks on login/register.
 * 10 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  message: 'Too many authentication attempts',
});

/**
 * transactionRateLimiter — Per-IP limiter for transaction submission.
 * 30 transactions per minute — prevents automated fraud probing.
 */
export const transactionRateLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  // Rate-limit by userId (from JWT) if available, else fall through to default IP key
  keyGenerator: (req) => req.user?.id || undefined,
});


/**
 * globalRateLimiter — Broad protection for the entire API.
 * 200 requests per 15 minutes per IP.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
