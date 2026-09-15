import pino from 'pino';
import { env } from '@/config/env';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'passwordHash',
  'otp',
  'code',
  'codeHash',
  'token',
  'accessToken',
  'refreshToken',
  '*.razorpaySignature',
  '*.cardNumber',
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
