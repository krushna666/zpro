import { prisma } from '@/lib/prisma';
import type { City } from '@prisma/client';

export interface PublicCity {
  id: string;
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  isPopular: boolean;
}

function toPublicCity(city: City): PublicCity {
  return {
    id: city.id,
    name: city.name,
    state: city.state,
    country: city.country,
    latitude: Number(city.latitude),
    longitude: Number(city.longitude),
    isPopular: city.isPopular,
  };
}

export async function listCities(popularOnly: boolean): Promise<PublicCity[]> {
  const cities = await prisma.city.findMany({
    where: popularOnly ? { isPopular: true } : undefined,
    orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
  });
  return cities.map(toPublicCity);
}

export async function searchCities(query: string): Promise<PublicCity[]> {
  const cities = await prisma.city.findMany({
    where: { name: { contains: query, mode: 'insensitive' } },
    orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
    take: 20,
  });
  return cities.map(toPublicCity);
}
