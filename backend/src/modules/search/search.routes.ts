import { Router } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { validateQuery } from '@/middleware/validate';
import * as searchController from './search.controller';
import { searchTripsQuerySchema } from './search.schemas';

export const searchRouter = Router();

searchRouter.get('/trips', validateQuery(searchTripsQuerySchema), asyncHandler(searchController.searchTrips));
