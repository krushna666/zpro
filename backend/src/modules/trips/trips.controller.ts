import { Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import * as tripsService from './trips.service';
import type { CreateTripInput } from './trips.schemas';

export async function createTrip(req: Request, res: Response): Promise<void> {
  const trip = await tripsService.createTrip(req.body as CreateTripInput);
  sendSuccess(res, trip, 'Trip created', 201);
}

export async function getTrip(req: Request, res: Response): Promise<void> {
  const trip = await tripsService.getTripDetail(req.params.tripId as string);
  sendSuccess(res, trip, 'Trip');
}
