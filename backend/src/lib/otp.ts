import crypto from 'node:crypto';
import argon2 from 'argon2';
import { logger } from '@/lib/logger';
import { env } from '@/config/env';
import { ApiError } from '@/lib/apiResponse';

export function generateOtpCode(): string {
  if (env.MOCK_OTP) {
    return env.DEV_OTP_CODE;
  }
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtpCode(code: string): Promise<string> {
  return argon2.hash(code);
}

export function verifyOtpCode(hash: string, code: string): Promise<boolean> {
  return argon2.verify(hash, code);
}

/**
 * Sends the OTP over SMS. Only a mock/dev-log delivery path exists today —
 * wiring a real SMS provider (Twilio/MSG91/etc.) is notifications-module work.
 */
export async function deliverOtp(phone: string, code: string): Promise<void> {
  if (env.MOCK_OTP) {
    logger.info({ phone, code }, 'MOCK_OTP: not sending a real SMS, logging the code instead');
    return;
  }
  throw ApiError.internal(
    'No SMS provider is configured for OTP delivery',
    'OTP_DELIVERY_UNAVAILABLE',
  );
}
