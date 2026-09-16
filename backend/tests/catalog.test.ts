import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';

const app = createApp();

let adminAccessToken: string;
let mumbaiId: string;
let puneId: string;

beforeAll(async () => {
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@busgo.app', password: 'ChangeMe123!' });
  adminAccessToken = login.body.data.accessToken as string;

  const mumbai = await request(app).get('/api/v1/cities/search').query({ q: 'Mumbai' });
  mumbaiId = mumbai.body.data[0].id as string;
  const pune = await request(app).get('/api/v1/cities/search').query({ q: 'Pune' });
  puneId = pune.body.data[0].id as string;
});

function admin() {
  return { Authorization: `Bearer ${adminAccessToken}` };
}

describe('operators', () => {
  it('requires admin auth to create or list', async () => {
    const noAuth = await request(app).get('/api/v1/operators');
    expect(noAuth.status).toBe(401);
  });

  it('creates an operator and rejects a duplicate slug', async () => {
    const slug = `op-${randomUUID().slice(0, 8)}`;
    const create = await request(app)
      .post('/api/v1/operators')
      .set(admin())
      .send({ name: 'Catalog Test Travels', slug });
    expect(create.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/v1/operators')
      .set(admin())
      .send({ name: 'Another', slug });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('SLUG_TAKEN');
  });
});

describe('catalog authoring end-to-end', () => {
  it('builds an operator -> bus -> layout -> route -> trip and computes per-seat pricing', async () => {
    const slug = `e2e-${randomUUID().slice(0, 8)}`;
    const operator = await request(app)
      .post('/api/v1/operators')
      .set(admin())
      .send({ name: 'E2E Travels', slug });
    const operatorId = operator.body.data.id as string;

    const busType = await request(app)
      .post('/api/v1/bus-types')
      .set(admin())
      .send({ name: `Type ${randomUUID().slice(0, 8)}`, category: 'SEATER', isAc: true });
    const busTypeId = busType.body.data.id as string;

    const bus = await request(app)
      .post(`/api/v1/operators/${operatorId}/buses`)
      .set(admin())
      .send({
        registrationNumber: `REG-${randomUUID().slice(0, 8)}`,
        name: 'E2E Coach',
        busTypeId,
        totalSeats: 4,
      });
    expect(bus.status).toBe(201);
    const busId = bus.body.data.id as string;

    const layout = await request(app)
      .post(`/api/v1/buses/${busId}/layouts`)
      .set(admin())
      .send({
        name: '2x2',
        rows: 2,
        columns: 2,
        seats: [
          { seatNumber: '1A', row: 1, column: 1, seatFormat: 'SEATER' },
          { seatNumber: '1B', row: 1, column: 2, seatFormat: 'SEATER' },
          { seatNumber: '2A', row: 2, column: 1, seatFormat: 'SEATER', priceMultiplier: 1.5 },
          { seatNumber: '2B', row: 2, column: 2, seatFormat: 'SEATER' },
        ],
      });
    expect(layout.status).toBe(201);
    const layoutId = layout.body.data.id as string;

    const route = await request(app)
      .post('/api/v1/routes')
      .set(admin())
      .send({
        operatorId,
        sourceCityId: mumbaiId,
        destinationCityId: puneId,
        distanceKm: 150,
        estimatedDurationMinutes: 210,
      });
    expect(route.status).toBe(201);
    const routeId = route.body.data.id as string;

    const departureAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const arrivalAt = new Date(departureAt.getTime() + 3 * 60 * 60 * 1000);

    const trip = await request(app)
      .post('/api/v1/trips')
      .set(admin())
      .send({
        operatorId,
        busId,
        routeId,
        busLayoutId: layoutId,
        departureAt: departureAt.toISOString(),
        arrivalAt: arrivalAt.toISOString(),
        baseFare: 200,
        boardingPoints: [
          { name: 'Stop A', address: 'Addr A', latitude: 19.0, longitude: 72.8, time: departureAt.toISOString() },
        ],
        droppingPoints: [
          { name: 'Stop B', address: 'Addr B', latitude: 18.5, longitude: 73.8, time: arrivalAt.toISOString() },
        ],
      });
    expect(trip.status).toBe(201);
    expect(trip.body.data.seats).toHaveLength(4);
    const seat2A = trip.body.data.seats.find((s: { seatNumber: string }) => s.seatNumber === '2A');
    expect(seat2A.price).toBe(300);
    const seat1A = trip.body.data.seats.find((s: { seatNumber: string }) => s.seatNumber === '1A');
    expect(seat1A.price).toBe(200);

    const detail = await request(app).get(`/api/v1/trips/${trip.body.data.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.availableSeatCount).toBe(4);

    const search = await request(app).get('/api/v1/search/trips').query({
      fromCityId: mumbaiId,
      toCityId: puneId,
      date: departureAt.toISOString().slice(0, 10),
    });
    expect(search.status).toBe(200);
    expect(search.body.data.some((t: { id: string }) => t.id === trip.body.data.id)).toBe(true);
  });

  it('rejects a trip whose bus does not belong to the given operator', async () => {
    const slugA = `mismatch-a-${randomUUID().slice(0, 8)}`;
    const slugB = `mismatch-b-${randomUUID().slice(0, 8)}`;
    const operatorA = await request(app).post('/api/v1/operators').set(admin()).send({ name: 'A', slug: slugA });
    const operatorB = await request(app).post('/api/v1/operators').set(admin()).send({ name: 'B', slug: slugB });

    const busType = await request(app)
      .post('/api/v1/bus-types')
      .set(admin())
      .send({ name: `Type ${randomUUID().slice(0, 8)}`, category: 'SEATER', isAc: false });

    const bus = await request(app)
      .post(`/api/v1/operators/${operatorA.body.data.id}/buses`)
      .set(admin())
      .send({
        registrationNumber: `REG-${randomUUID().slice(0, 8)}`,
        name: 'Bus A',
        busTypeId: busType.body.data.id,
        totalSeats: 1,
      });

    const layout = await request(app)
      .post(`/api/v1/buses/${bus.body.data.id}/layouts`)
      .set(admin())
      .send({ name: 'x', rows: 1, columns: 1, seats: [{ seatNumber: '1A', row: 1, column: 1, seatFormat: 'SEATER' }] });

    const route = await request(app)
      .post('/api/v1/routes')
      .set(admin())
      .send({
        operatorId: operatorA.body.data.id,
        sourceCityId: mumbaiId,
        destinationCityId: puneId,
        distanceKm: 150,
        estimatedDurationMinutes: 210,
      });

    const now = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const later = new Date(now.getTime() + 60 * 60 * 1000);

    const trip = await request(app)
      .post('/api/v1/trips')
      .set(admin())
      .send({
        operatorId: operatorB.body.data.id,
        busId: bus.body.data.id,
        routeId: route.body.data.id,
        busLayoutId: layout.body.data.id,
        departureAt: now.toISOString(),
        arrivalAt: later.toISOString(),
        baseFare: 100,
        boardingPoints: [{ name: 'A', address: 'A', latitude: 1, longitude: 1, time: now.toISOString() }],
        droppingPoints: [{ name: 'B', address: 'B', latitude: 1, longitude: 1, time: later.toISOString() }],
      });

    expect(trip.status).toBe(400);
    expect(trip.body.error.code).toBe('BUS_OPERATOR_MISMATCH');
  });
});

describe('GET /api/v1/search/trips', () => {
  it('rejects an invalid query', async () => {
    const res = await request(app).get('/api/v1/search/trips').query({ fromCityId: 'not-a-uuid' });
    expect(res.status).toBe(422);
  });

  it('404s for an unknown city id', async () => {
    const res = await request(app).get('/api/v1/search/trips').query({
      fromCityId: randomUUID(),
      toCityId: puneId,
      date: '2030-01-01',
    });
    expect(res.status).toBe(404);
  });
});
