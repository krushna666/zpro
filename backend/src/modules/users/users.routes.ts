import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { asyncHandler } from '@/lib/asyncHandler';
import * as usersController from './users.controller';
import { savedPassengerSchema, updateProfileSchema, updateSavedPassengerSchema } from './users.schemas';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.patch('/me', validateBody(updateProfileSchema), asyncHandler(usersController.updateMe));

usersRouter.get('/me/saved-passengers', asyncHandler(usersController.listSavedPassengers));
usersRouter.post(
  '/me/saved-passengers',
  validateBody(savedPassengerSchema),
  asyncHandler(usersController.createSavedPassenger),
);
usersRouter.patch(
  '/me/saved-passengers/:id',
  validateBody(updateSavedPassengerSchema),
  asyncHandler(usersController.updateSavedPassenger),
);
usersRouter.delete('/me/saved-passengers/:id', asyncHandler(usersController.deleteSavedPassenger));
