import rateLimit from 'express-rate-limit';
import { ApiError } from '@/lib/apiResponse';

function handler(): never {
  throw ApiError.tooManyRequests();
}

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: (req) => `${req.ip}:${req.body?.identifier ?? 'unknown'}`,
});
