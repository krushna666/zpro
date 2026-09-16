import { Router } from 'express';
import { requireAuth, requireRoles } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { asyncHandler } from '@/lib/asyncHandler';
import * as catalogController from './catalog.controller';
import { createBusTypeSchema } from './catalog.schemas';

export const busTypesRouter = Router();

busTypesRouter.get('/', asyncHandler(catalogController.listBusTypes));
busTypesRouter.post(
  '/',
  requireAuth,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  validateBody(createBusTypeSchema),
  asyncHandler(catalogController.createBusType),
);
