import { Router } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { authRouter } from '@/modules/auth/auth.routes';
import { usersRouter } from '@/modules/users/users.routes';
import { citiesRouter } from '@/modules/cities/cities.routes';
import { operatorsRouter } from '@/modules/catalog/operators.routes';
import { busTypesRouter } from '@/modules/catalog/bus-types.routes';
import { busesRouter } from '@/modules/catalog/buses.routes';
import { routesRouter } from '@/modules/catalog/routes.routes';
import { tripsRouter } from '@/modules/trips/trips.routes';
import { searchRouter } from '@/modules/search/search.routes';

export const v1Router = Router();

v1Router.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'BusGo API is healthy');
});

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/cities', citiesRouter);
v1Router.use('/operators', operatorsRouter);
v1Router.use('/bus-types', busTypesRouter);
v1Router.use('/buses', busesRouter);
v1Router.use('/routes', routesRouter);
v1Router.use('/trips', tripsRouter);
v1Router.use('/search', searchRouter);

// Additional module routers are mounted here as they are implemented:
// v1Router.use('/bookings', bookingsRouter);
// v1Router.use('/seat-locks', seatLocksRouter);
// v1Router.use('/payments', paymentsRouter);
// v1Router.use('/webhooks', webhooksRouter);
// v1Router.use('/coupons', couponsRouter);
// v1Router.use('/reviews', reviewsRouter);
// v1Router.use('/notifications', notificationsRouter);
// v1Router.use('/support', supportRouter);
// v1Router.use('/admin', adminRouter);
