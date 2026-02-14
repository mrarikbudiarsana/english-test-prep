import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // This API performs frequent autosave/polling requests during tests.
  // Keep global protection, but avoid throttling normal usage.
  max: process.env.NODE_ENV === 'production' ? 600 : 2000,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ignore preflight + lightweight session/health checks.
    if (req.method === 'OPTIONS') return true;
    if (req.path === '/health') return true;
    if (req.path === '/api/v1/auth/me' && req.method === 'GET') return true;
    return false;
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 200,
  message: { error: 'Too many auth attempts, please try again later' },
});

export const scoringLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many scoring requests, please try again later' },
});
