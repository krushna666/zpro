import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/apiResponse';
import { deliverOtp, generateOtpCode, hashOtpCode, verifyOtpCode } from '@/lib/otp';
import { generateReferralCode } from '@/lib/referralCode';
import {
  hashToken,
  parseDurationMs,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type RefreshTokenPayload,
} from '@/lib/tokens';
import { env } from '@/config/env';
import { toPublicUser, userInclude, type PublicUser, type UserWithRoles } from '@/modules/users/user.mapper';
import type { LoginInput, OtpVerifyInput, RegisterInput } from './auth.schemas';

export interface SessionMeta {
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

async function issueSession(
  user: UserWithRoles,
  meta: SessionMeta,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken({
    sub: user.id,
    roles: user.roles.map((userRole) => userRole.role.name),
  });

  const jti = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      deviceId: meta.deviceId,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN)),
    },
  });

  return { accessToken, refreshToken };
}

async function createUserWithRole(data: {
  phone?: string;
  email?: string;
  passwordHash?: string;
  fullName: string;
  roleName: string;
  phoneVerifiedAt?: Date;
  emailVerifiedAt?: Date;
}): Promise<UserWithRoles> {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: data.roleName } });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await prisma.user.create({
        data: {
          phone: data.phone,
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          referralCode: generateReferralCode(),
          phoneVerifiedAt: data.phoneVerifiedAt,
          emailVerifiedAt: data.emailVerifiedAt,
          roles: { create: { roleId: role.id } },
        },
        include: userInclude,
      });
    } catch (err) {
      const isReferralCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        (err.meta?.target as string[] | undefined)?.includes('referralCode');
      if (!isReferralCodeCollision) {
        throw err;
      }
    }
  }
  throw ApiError.internal('Could not allocate a unique referral code');
}

const OTP_EXPIRES_IN_SECONDS = 5 * 60;

export async function requestOtp(phone: string): Promise<{ expiresInSeconds: number; devCode?: string }> {
  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);

  await prisma.otpSession.create({
    data: {
      identifier: phone,
      purpose: 'LOGIN',
      channel: 'SMS',
      codeHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRES_IN_SECONDS * 1000),
    },
  });

  await deliverOtp(phone, code);

  return { expiresInSeconds: OTP_EXPIRES_IN_SECONDS, devCode: env.MOCK_OTP ? code : undefined };
}

export async function verifyOtp(
  input: OtpVerifyInput,
  meta: SessionMeta,
): Promise<AuthSession & { isNewUser: boolean }> {
  const session = await prisma.otpSession.findFirst({
    where: { identifier: input.phone, purpose: 'LOGIN', verifiedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!session || session.expiresAt < new Date()) {
    throw ApiError.badRequest('OTP_EXPIRED', 'This code has expired. Request a new one.');
  }
  if (session.attempts >= session.maxAttempts) {
    throw ApiError.tooManyRequests('Too many incorrect attempts. Request a new code.');
  }

  const isValid = await verifyOtpCode(session.codeHash, input.code);
  if (!isValid) {
    await prisma.otpSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    });
    throw ApiError.badRequest('OTP_INVALID', 'That code is incorrect.');
  }

  await prisma.otpSession.update({ where: { id: session.id }, data: { verifiedAt: new Date() } });

  let user = await prisma.user.findUnique({ where: { phone: input.phone }, include: userInclude });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await createUserWithRole({
      phone: input.phone,
      fullName: input.fullName?.trim() || 'BusGo Traveller',
      roleName: 'CUSTOMER',
      phoneVerifiedAt: new Date(),
    });
  } else if (!user.phoneVerifiedAt) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date() },
      include: userInclude,
    });
  }

  const { accessToken, refreshToken } = await issueSession(user, meta);
  return { user: toPublicUser(user), accessToken, refreshToken, isNewUser };
}

export async function register(input: RegisterInput, meta: SessionMeta): Promise<AuthSession> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await createUserWithRole({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    roleName: 'CUSTOMER',
  });

  const { accessToken, refreshToken } = await issueSession(user, meta);
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function login(input: LoginInput, meta: SessionMeta): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: userInclude });
  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isValid = await argon2.verify(user.passwordHash, input.password);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  if (user.status !== 'ACTIVE') {
    throw ApiError.forbidden('This account is not active', 'ACCOUNT_INACTIVE');
  }

  const { accessToken, refreshToken } = await issueSession(user, meta);
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function refresh(
  refreshTokenInput: string,
  meta: SessionMeta,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: RefreshTokenPayload;
  try {
    payload = verifyRefreshToken(refreshTokenInput);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'TOKEN_INVALID');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!stored || stored.tokenHash !== hashToken(refreshTokenInput)) {
    throw ApiError.unauthorized('Invalid refresh token', 'TOKEN_INVALID');
  }

  if (stored.revokedAt || stored.expiresAt < new Date()) {
    // Reuse of an already-rotated (or expired) token looks like theft — kill the whole session family.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized('Session expired, please log in again', 'TOKEN_REUSED');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId }, include: userInclude });
  if (!user) {
    throw ApiError.unauthorized();
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  return issueSession(user, meta);
}

export async function logout(refreshTokenInput: string): Promise<void> {
  let payload: RefreshTokenPayload;
  try {
    payload = verifyRefreshToken(refreshTokenInput);
  } catch {
    return;
  }
  await prisma.refreshToken.updateMany({
    where: { id: payload.jti, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return toPublicUser(user);
}
