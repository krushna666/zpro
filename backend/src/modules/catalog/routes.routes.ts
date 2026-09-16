import { Router } from 'express';
import { requireAuth, requireRoles } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { asyncHandler } from '@/lib/asyncHandler';
import * as catalogController from './catalog.controller';
import { createRouteSchema } from './catalog.schemas';

export const routesRouter = Router();

routesRouter.use(requireAuth, requireRoles('SUPER_ADMIN', 'ADMIN'));

routesRouter.post('/', validateBody(createRouteSchema), asyncHandler(catalogController.createRoute));
routesRouter.get('/', asyncHandler(catalogController.listRoutes));
routesRouter.get('/:routeId', asyncHandler(catalogController.getRoute));
