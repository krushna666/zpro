import { Router } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { validateQuery } from '@/middleware/validate';
import * as citiesController from './cities.controller';
import { cityListQuerySchema, citySearchQuerySchema } from './cities.schemas';

export const citiesRouter = Router();

citiesRouter.get('/search', validateQuery(citySearchQuerySchema), asyncHandler(citiesController.search));
citiesRouter.get('/', validateQuery(cityListQuerySchema), asyncHandler(citiesController.list));
