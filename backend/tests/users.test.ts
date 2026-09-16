import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';

const app = createApp();

async function registerUser() {
  const email = `test-${randomUUID()}@example.com`;
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ fullName: 'Passenger Owner', email, password: 'Password123' });
  return { accessToken: res.body.data.accessToken as string, userId: res.body.data.user.id as string };
}

describe('PATCH /api/v1/users/me', () => {
  it('updates profile fields for the authenticated user', async () => {
    const { accessToken } = await registerUser();

    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullName: 'Updated Name', gender: 'FEMALE', languagePreference: 'hi' });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Updated Name');
    expect(res.body.data.gender).toBe('FEMALE');
    expect(res.body.data.languagePreference).toBe('hi');
  });

  it('rejects requests with no access token', async () => {
    const res = await request(app).patch('/api/v1/users/me').send({ fullName: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('saved passengers', () => {
  it('supports create, list, update, and delete, scoped to the owner', async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

    const create = await request(app)
      .post('/api/v1/users/me/saved-passengers')
      .set(auth(owner.accessToken))
      .send({ fullName: 'Jane Doe', age: 30, gender: 'FEMALE', isDefault: true });
    expect(create.status).toBe(201);
    expect(create.body.data.isDefault).toBe(true);
    const passengerId = create.body.data.id as string;

    const list = await request(app)
      .get('/api/v1/users/me/saved-passengers')
      .set(auth(owner.accessToken));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const update = await request(app)
      .patch(`/api/v1/users/me/saved-passengers/${passengerId}`)
      .set(auth(owner.accessToken))
      .send({ age: 31 });
    expect(update.status).toBe(200);
    expect(update.body.data.age).toBe(31);

    const strangerUpdate = await request(app)
      .patch(`/api/v1/users/me/saved-passengers/${passengerId}`)
      .set(auth(stranger.accessToken))
      .send({ age: 99 });
    expect(strangerUpdate.status).toBe(404);

    const strangerDelete = await request(app)
      .delete(`/api/v1/users/me/saved-passengers/${passengerId}`)
      .set(auth(stranger.accessToken));
    expect(strangerDelete.status).toBe(404);

    const ownerDelete = await request(app)
      .delete(`/api/v1/users/me/saved-passengers/${passengerId}`)
      .set(auth(owner.accessToken));
    expect(ownerDelete.status).toBe(200);

    const listAfterDelete = await request(app)
      .get('/api/v1/users/me/saved-passengers')
      .set(auth(owner.accessToken));
    expect(listAfterDelete.body.data).toHaveLength(0);
  });

  it('only keeps one default passenger at a time', async () => {
    const { accessToken } = await registerUser();
    const auth = { Authorization: `Bearer ${accessToken}` };

    const first = await request(app)
      .post('/api/v1/users/me/saved-passengers')
      .set(auth)
      .send({ fullName: 'First', age: 25, gender: 'MALE', isDefault: true });
    const second = await request(app)
      .post('/api/v1/users/me/saved-passengers')
      .set(auth)
      .send({ fullName: 'Second', age: 26, gender: 'MALE', isDefault: true });

    const list = await request(app).get('/api/v1/users/me/saved-passengers').set(auth);
    const defaults = list.body.data.filter((p: { isDefault: boolean }) => p.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(second.body.data.id);
    expect(first.status).toBe(201);
  });
});
