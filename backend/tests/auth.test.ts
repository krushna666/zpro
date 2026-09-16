import { randomInt, randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { prisma } from '@/lib/prisma';

const app = createApp();

function uniquePhone(): string {
  return `9${randomInt(100000000, 999999999)}`;
}

function uniqueEmail(): string {
  return `test-${randomUUID()}@example.com`;
}

beforeAll(async () => {
  await prisma.role.upsert({ where: { name: 'CUSTOMER' }, update: {}, create: { name: 'CUSTOMER' } });
});

describe('phone OTP login', () => {
  it('requests an OTP, rejects a wrong code, then accepts the right one and creates a user', async () => {
    const phone = uniquePhone();

    const requestRes = await request(app).post('/api/v1/auth/otp/request').send({ phone });
    expect(requestRes.status).toBe(200);
    const devCode = requestRes.body.data.devCode as string;
    expect(devCode).toMatch(/^\d{6}$/);

    const wrongRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: '000000' });
    expect(wrongRes.status).toBe(400);
    expect(wrongRes.body.error.code).toBe('OTP_INVALID');

    const verifyRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: devCode, fullName: 'Test Rider' });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.isNewUser).toBe(true);
    expect(verifyRes.body.data.user.phone).toBe(phone);
    expect(verifyRes.body.data.user.roles).toContain('CUSTOMER');
    expect(verifyRes.body.data.accessToken).toBeTypeOf('string');
    expect(verifyRes.body.data.refreshToken).toBeTypeOf('string');
  });

  it('rejects an expired/already-used OTP session', async () => {
    const phone = uniquePhone();
    const requestRes = await request(app).post('/api/v1/auth/otp/request').send({ phone });
    const devCode = requestRes.body.data.devCode as string;

    await request(app).post('/api/v1/auth/otp/verify').send({ phone, code: devCode });
    const secondAttempt = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: devCode });

    expect(secondAttempt.status).toBe(400);
    expect(secondAttempt.body.error.code).toBe('OTP_EXPIRED');
  });

  it('rejects a malformed phone number before hitting the database', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({ phone: '12345' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('email/password auth', () => {
  it('registers a new account and rejects a duplicate email', async () => {
    const email = uniqueEmail();
    const first = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'New User', email, password: 'Password123' });
    expect(first.status).toBe(201);
    expect(first.body.data.user.email).toBe(email);

    const duplicate = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'New User', email, password: 'Password123' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    const email = uniqueEmail();
    const password = 'Password123';
    await request(app).post('/api/v1/auth/register').send({ fullName: 'Login User', email, password });

    const goodLogin = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.body.data.user.email).toBe(email);

    const badLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrong-password' });
    expect(badLogin.status).toBe(401);
    expect(badLogin.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('/auth/me', () => {
  it('returns the current user for a valid access token and rejects a missing one', async () => {
    const email = uniqueEmail();
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Me User', email, password: 'Password123' });
    const accessToken = registerRes.body.data.accessToken as string;

    const meRes = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(email);

    const noAuthRes = await request(app).get('/api/v1/auth/me');
    expect(noAuthRes.status).toBe(401);
  });
});

describe('refresh token rotation', () => {
  it('rotates on refresh and detects reuse of a retired token', async () => {
    const email = uniqueEmail();
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Refresh User', email, password: 'Password123' });
    const originalRefreshToken = registerRes.body.data.refreshToken as string;

    const firstRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(firstRefresh.status).toBe(200);
    const rotatedRefreshToken = firstRefresh.body.data.refreshToken as string;
    expect(rotatedRefreshToken).not.toBe(originalRefreshToken);

    const reuseOriginal = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(reuseOriginal.status).toBe(401);
    expect(reuseOriginal.body.error.code).toBe('TOKEN_REUSED');

    // Reuse detection revokes the whole session family, so even the newly-rotated token is dead now.
    const rotatedAfterReuse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotatedRefreshToken });
    expect(rotatedAfterReuse.status).toBe(401);
    expect(rotatedAfterReuse.body.error.code).toBe('TOKEN_REUSED');
  });
});

describe('logout', () => {
  it('revokes the refresh token so it can no longer be used', async () => {
    const email = uniqueEmail();
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Logout User', email, password: 'Password123' });
    const refreshToken = registerRes.body.data.refreshToken as string;

    const logoutRes = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const afterLogout = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(afterLogout.status).toBe(401);
  });
});
