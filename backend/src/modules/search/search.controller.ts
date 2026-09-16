import { Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import * as searchService from './search.service';
import type { SearchTripsQuery } from './search.schemas';

export async function searchTrips(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as SearchTripsQuery;
  const trips = await searchService.searchTrips(query);
  sendSuccess(res, trips, 'Trips');
}
