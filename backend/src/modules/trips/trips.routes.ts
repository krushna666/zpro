import { Router } from 'express';
import { requireAuth, requireRoles } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { asyncHandler } from '@/lib/asyncHandler';
import * as tripsController from './trips.controller';
import { createTripSchema } from './trips.schemas';

export const tripsRouter = Router();

tripsRouter.post(
  '/',
  requireAuth,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  validateBody(createTripSchema),
  asyncHandler(tripsController.createTrip),
);
tripsRouter.get('/:tripId', asyncHandler(tripsController.getTrip));
