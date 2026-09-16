import rateLimit from 'express-rate-limit';
import { ApiError } from '@/lib/apiResponse';
import { env } from '@/config/env';

function handler(): never {
  throw ApiError.tooManyRequests();
}

// Rate limiting is disabled under the test runner so integration tests firing
// many requests in a row from the same IP don't trip it; real requests are
// never made with NODE_ENV=test.
const skip = (): boolean => env.NODE_ENV === 'test';

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip,
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip,
});

export const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip,
  keyGenerator: (req) => `${req.ip}:${req.body?.identifier ?? 'unknown'}`,
});
