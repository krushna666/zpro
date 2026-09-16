import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';

const app = createApp();

describe('GET /api/v1/cities', () => {
  it('lists the seeded cities, popular first then alphabetical', async () => {
    const res = await request(app).get('/api/v1/cities');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);
    expect(res.body.data[0]).toMatchObject({
      name: expect.any(String),
      state: expect.any(String),
      latitude: expect.any(Number),
      longitude: expect.any(Number),
    });
  });

  it('filters to popular cities only when requested', async () => {
    const res = await request(app).get('/api/v1/cities').query({ popular: 'true' });
    expect(res.status).toBe(200);
    expect(res.body.data.every((city: { isPopular: boolean }) => city.isPopular)).toBe(true);
  });
});

describe('GET /api/v1/cities/search', () => {
  it('finds a seeded city by a case-insensitive partial match', async () => {
    const res = await request(app).get('/api/v1/cities/search').query({ q: 'mum' });
    expect(res.status).toBe(200);
    expect(res.body.data.some((city: { name: string }) => city.name === 'Mumbai')).toBe(true);
  });

  it('rejects a missing query parameter', async () => {
    const res = await request(app).get('/api/v1/cities/search');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
