import { Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import * as authService from './auth.service';
import type { SessionMeta } from './auth.service';
import type { LoginInput, OtpRequestInput, OtpVerifyInput, RefreshInput, RegisterInput } from './auth.schemas';

function sessionMeta(req: Request): SessionMeta {
  return {
    deviceId: (req.body as { deviceId?: string }).deviceId,
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress: req.ip,
  };
}

export async function requestOtp(req: Request, res: Response): Promise<void> {
  const { phone } = req.body as OtpRequestInput;
  const result = await authService.requestOtp(phone);
  sendSuccess(res, result, 'OTP sent');
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const input = req.body as OtpVerifyInput;
  const result = await authService.verifyOtp(input, sessionMeta(req));
  sendSuccess(res, result, result.isNewUser ? 'Account created' : 'Logged in');
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const result = await authService.register(input, sessionMeta(req));
  sendSuccess(res, result, 'Account created', 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await authService.login(input, sessionMeta(req));
  sendSuccess(res, result, 'Logged in');
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshInput;
  const result = await authService.refresh(refreshToken, sessionMeta(req));
  sendSuccess(res, result, 'Token refreshed');
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshInput;
  await authService.logout(refreshToken);
  sendSuccess(res, { success: true }, 'Logged out');
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.user!.sub);
  sendSuccess(res, user, 'Current user');
}
