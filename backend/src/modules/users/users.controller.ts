import { Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import * as usersService from './users.service';
import type { SavedPassengerInput, UpdateProfileInput, UpdateSavedPassengerInput } from './users.schemas';

export async function updateMe(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateProfileInput;
  const user = await usersService.updateProfile(req.user!.sub, input);
  sendSuccess(res, user, 'Profile updated');
}

export async function listSavedPassengers(req: Request, res: Response): Promise<void> {
  const passengers = await usersService.listSavedPassengers(req.user!.sub);
  sendSuccess(res, passengers, 'Saved passengers');
}

export async function createSavedPassenger(req: Request, res: Response): Promise<void> {
  const input = req.body as SavedPassengerInput;
  const passenger = await usersService.createSavedPassenger(req.user!.sub, input);
  sendSuccess(res, passenger, 'Saved passenger created', 201);
}

export async function updateSavedPassenger(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateSavedPassengerInput;
  const passengerId = req.params.id as string;
  const passenger = await usersService.updateSavedPassenger(req.user!.sub, passengerId, input);
  sendSuccess(res, passenger, 'Saved passenger updated');
}

export async function deleteSavedPassenger(req: Request, res: Response): Promise<void> {
  const passengerId = req.params.id as string;
  await usersService.deleteSavedPassenger(req.user!.sub, passengerId);
  sendSuccess(res, { success: true }, 'Saved passenger deleted');
}
