import { Router } from 'express';
import { requireAuth, requireRoles } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { asyncHandler } from '@/lib/asyncHandler';
import * as catalogController from './catalog.controller';
import { createBusSchema, createOperatorSchema, updateOperatorSchema } from './catalog.schemas';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export const operatorsRouter = Router();

operatorsRouter.use(requireAuth, requireRoles(...ADMIN_ROLES));

operatorsRouter.post('/', validateBody(createOperatorSchema), asyncHandler(catalogController.createOperator));
operatorsRouter.get('/', asyncHandler(catalogController.listOperators));
operatorsRouter.get('/:operatorId', asyncHandler(catalogController.getOperator));
operatorsRouter.patch(
  '/:operatorId',
  validateBody(updateOperatorSchema),
  asyncHandler(catalogController.updateOperator),
);

operatorsRouter.post(
  '/:operatorId/buses',
  validateBody(createBusSchema),
  asyncHandler(catalogController.createBus),
);
operatorsRouter.get('/:operatorId/buses', asyncHandler(catalogController.listBusesForOperator));
