import { Router } from 'express';
import { requireAuth, requireRoles } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { asyncHandler } from '@/lib/asyncHandler';
import * as catalogController from './catalog.controller';
import { createBusLayoutSchema, updateBusSchema } from './catalog.schemas';

export const busesRouter = Router();

busesRouter.use(requireAuth, requireRoles('SUPER_ADMIN', 'ADMIN'));

busesRouter.get('/:busId', asyncHandler(catalogController.getBus));
busesRouter.patch('/:busId', validateBody(updateBusSchema), asyncHandler(catalogController.updateBus));

busesRouter.post(
  '/:busId/layouts',
  validateBody(createBusLayoutSchema),
  asyncHandler(catalogController.createBusLayout),
);
busesRouter.get('/:busId/layouts', asyncHandler(catalogController.listBusLayouts));
