import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Disable rate limiting in development mode
const createLimiter = (config) => {
  if (isDev) {
    return (req, res, next) => next(); // Skip rate limiting in dev
  }
  return rateLimit(config);
};

// General API rate limiter - optimized for high traffic
const apiLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10000, // 10000 requests per minute in production (very high)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for authentication endpoints - optimized for high traffic
const authLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000, // 1000 auth requests per minute in production (very high)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for password reset
const passwordResetLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 password reset attempts per 15 minutes (very high)
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
});

// Rate limiter for order creation
const orderLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // 500 orders per minute in production (very high)
  message: {
    success: false,
    message: 'Too many order attempts, please try again later.'
  },
});

export {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  orderLimiter
};
