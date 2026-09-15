import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';

describe('GET /api/v1/health', () => {
  it('returns 200 with a success envelope', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('GET /api/v1/unknown-route', () => {
  it('returns a standard 404 error envelope', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
