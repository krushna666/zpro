import { Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import * as citiesService from './cities.service';
import type { CityListQuery, CitySearchQuery } from './cities.schemas';

export async function list(req: Request, res: Response): Promise<void> {
  const { popular } = req.query as unknown as CityListQuery;
  const cities = await citiesService.listCities(popular === 'true');
  sendSuccess(res, cities, 'Cities');
}

export async function search(req: Request, res: Response): Promise<void> {
  const { q } = req.query as unknown as CitySearchQuery;
  const cities = await citiesService.searchCities(q);
  sendSuccess(res, cities, 'Cities');
}
