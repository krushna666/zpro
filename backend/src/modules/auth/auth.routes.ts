import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { authRateLimiter, otpRateLimiter } from '@/middleware/rateLimit';
import { validateBody } from '@/middleware/validate';
import { asyncHandler } from '@/lib/asyncHandler';
import * as authController from './auth.controller';
import {
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema,
  registerSchema,
} from './auth.schemas';

export const authRouter = Router();

authRouter.post(
  '/otp/request',
  otpRateLimiter,
  validateBody(otpRequestSchema),
  asyncHandler(authController.requestOtp),
);
authRouter.post(
  '/otp/verify',
  authRateLimiter,
  validateBody(otpVerifySchema),
  asyncHandler(authController.verifyOtp),
);
authRouter.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post('/login', authRateLimiter, validateBody(loginSchema), asyncHandler(authController.login));
authRouter.post(
  '/refresh',
  authRateLimiter,
  validateBody(refreshSchema),
  asyncHandler(authController.refresh),
);
authRouter.post('/logout', validateBody(refreshSchema), asyncHandler(authController.logout));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
