import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/apiResponse';
import { toPublicTripSummary, tripSummaryInclude, type PublicTrip } from '@/modules/trips/trips.service';
import type { SearchTripsQuery } from './search.schemas';

async function assertCityExists(cityId: string): Promise<void> {
  const exists = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
  if (!exists) {
    throw ApiError.notFound('City not found');
  }
}

export async function searchTrips(query: SearchTripsQuery): Promise<PublicTrip[]> {
  await Promise.all([assertCityExists(query.fromCityId), assertCityExists(query.toCityId)]);

  const dayStart = new Date(`${query.date}T00:00:00.000Z`);
  const dayEnd = new Date(`${query.date}T23:59:59.999Z`);

  const trips = await prisma.trip.findMany({
    where: {
      status: 'SCHEDULED',
      departureAt: { gte: dayStart, lte: dayEnd },
      route: { sourceCityId: query.fromCityId, destinationCityId: query.toCityId },
    },
    include: tripSummaryInclude,
    orderBy: { departureAt: 'asc' },
  });

  return trips.map(toPublicTripSummary);
}
