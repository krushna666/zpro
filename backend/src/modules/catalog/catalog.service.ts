import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/apiResponse';
import { Prisma } from '@prisma/client';
import type { Bus, BusLayout, BusSeat, BusType, Operator, Route, RouteStop } from '@prisma/client';
import type {
  CreateBusInput,
  CreateBusLayoutInput,
  CreateBusTypeInput,
  CreateOperatorInput,
  CreateRouteInput,
  UpdateBusInput,
  UpdateOperatorInput,
} from './catalog.schemas';

function isUniqueConstraintError(err: unknown, field: string): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002' &&
    (err.meta?.target as string[] | undefined)?.includes(field) === true
  );
}

// ---------------------------------------------------------------- Operators

export interface PublicOperator {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  gstNumber: string | null;
  address: string | null;
  rating: number;
  totalReviews: number;
  status: string;
  createdAt: string;
}

function toPublicOperator(operator: Operator): PublicOperator {
  return {
    id: operator.id,
    name: operator.name,
    slug: operator.slug,
    logoUrl: operator.logoUrl,
    contactEmail: operator.contactEmail,
    contactPhone: operator.contactPhone,
    gstNumber: operator.gstNumber,
    address: operator.address,
    rating: Number(operator.rating),
    totalReviews: operator.totalReviews,
    status: operator.status,
    createdAt: operator.createdAt.toISOString(),
  };
}

export async function createOperator(input: CreateOperatorInput): Promise<PublicOperator> {
  try {
    const operator = await prisma.operator.create({ data: input });
    return toPublicOperator(operator);
  } catch (err) {
    if (isUniqueConstraintError(err, 'slug')) {
      throw ApiError.conflict('An operator with this slug already exists', 'SLUG_TAKEN');
    }
    throw err;
  }
}

export async function listOperators(): Promise<PublicOperator[]> {
  const operators = await prisma.operator.findMany({ orderBy: { name: 'asc' } });
  return operators.map(toPublicOperator);
}

export async function getOperator(operatorId: string): Promise<PublicOperator> {
  const operator = await prisma.operator.findUnique({ where: { id: operatorId } });
  if (!operator) {
    throw ApiError.notFound('Operator not found');
  }
  return toPublicOperator(operator);
}

export async function updateOperator(operatorId: string, input: UpdateOperatorInput): Promise<PublicOperator> {
  await getOperator(operatorId);
  try {
    const operator = await prisma.operator.update({ where: { id: operatorId }, data: input });
    return toPublicOperator(operator);
  } catch (err) {
    if (isUniqueConstraintError(err, 'slug')) {
      throw ApiError.conflict('An operator with this slug already exists', 'SLUG_TAKEN');
    }
    throw err;
  }
}

// ---------------------------------------------------------------- Bus types

export interface PublicBusType {
  id: string;
  name: string;
  category: string;
  isAc: boolean;
  description: string | null;
}

function toPublicBusType(busType: BusType): PublicBusType {
  return {
    id: busType.id,
    name: busType.name,
    category: busType.category,
    isAc: busType.isAc,
    description: busType.description,
  };
}

export async function createBusType(input: CreateBusTypeInput): Promise<PublicBusType> {
  try {
    const busType = await prisma.busType.create({ data: input });
    return toPublicBusType(busType);
  } catch (err) {
    if (isUniqueConstraintError(err, 'name')) {
      throw ApiError.conflict('A bus type with this name already exists', 'NAME_TAKEN');
    }
    throw err;
  }
}

export async function listBusTypes(): Promise<PublicBusType[]> {
  const busTypes = await prisma.busType.findMany({ orderBy: { name: 'asc' } });
  return busTypes.map(toPublicBusType);
}

// --------------------------------------------------------------------- Buses

export interface PublicBus {
  id: string;
  operatorId: string;
  registrationNumber: string;
  name: string;
  busTypeId: string;
  totalSeats: number;
  amenities: unknown;
  photos: unknown;
  rating: number;
  totalReviews: number;
}

function toPublicBus(bus: Bus): PublicBus {
  return {
    id: bus.id,
    operatorId: bus.operatorId,
    registrationNumber: bus.registrationNumber,
    name: bus.name,
    busTypeId: bus.busTypeId,
    totalSeats: bus.totalSeats,
    amenities: bus.amenities,
    photos: bus.photos,
    rating: Number(bus.rating),
    totalReviews: bus.totalReviews,
  };
}

async function assertOperatorExists(operatorId: string): Promise<void> {
  const exists = await prisma.operator.findUnique({ where: { id: operatorId }, select: { id: true } });
  if (!exists) {
    throw ApiError.notFound('Operator not found');
  }
}

export async function createBus(operatorId: string, input: CreateBusInput): Promise<PublicBus> {
  await assertOperatorExists(operatorId);
  try {
    const bus = await prisma.bus.create({ data: { ...input, operatorId } });
    return toPublicBus(bus);
  } catch (err) {
    if (isUniqueConstraintError(err, 'registrationNumber')) {
      throw ApiError.conflict('A bus with this registration number already exists', 'REGISTRATION_TAKEN');
    }
    throw err;
  }
}

export async function listBusesForOperator(operatorId: string): Promise<PublicBus[]> {
  await assertOperatorExists(operatorId);
  const buses = await prisma.bus.findMany({ where: { operatorId }, orderBy: { name: 'asc' } });
  return buses.map(toPublicBus);
}

export async function getBus(busId: string): Promise<PublicBus> {
  const bus = await prisma.bus.findUnique({ where: { id: busId } });
  if (!bus) {
    throw ApiError.notFound('Bus not found');
  }
  return toPublicBus(bus);
}

export async function updateBus(busId: string, input: UpdateBusInput): Promise<PublicBus> {
  await getBus(busId);
  try {
    const bus = await prisma.bus.update({ where: { id: busId }, data: input });
    return toPublicBus(bus);
  } catch (err) {
    if (isUniqueConstraintError(err, 'registrationNumber')) {
      throw ApiError.conflict('A bus with this registration number already exists', 'REGISTRATION_TAKEN');
    }
    throw err;
  }
}

// --------------------------------------------------------------- Bus layouts

export interface PublicBusSeat {
  id: string;
  seatNumber: string;
  row: number;
  column: number;
  deck: string;
  seatFormat: string;
  isLadiesSeat: boolean;
  priceMultiplier: number;
}

export interface PublicBusLayout {
  id: string;
  busId: string;
  name: string;
  rows: number;
  columns: number;
  deckCount: number;
  seats: PublicBusSeat[];
}

function toPublicBusSeat(seat: BusSeat): PublicBusSeat {
  return {
    id: seat.id,
    seatNumber: seat.seatNumber,
    row: seat.row,
    column: seat.column,
    deck: seat.deck,
    seatFormat: seat.seatFormat,
    isLadiesSeat: seat.isLadiesSeat,
    priceMultiplier: Number(seat.priceMultiplier),
  };
}

function toPublicBusLayout(layout: BusLayout & { seats: BusSeat[] }): PublicBusLayout {
  return {
    id: layout.id,
    busId: layout.busId,
    name: layout.name,
    rows: layout.rows,
    columns: layout.columns,
    deckCount: layout.deckCount,
    seats: layout.seats.map(toPublicBusSeat),
  };
}

export async function createBusLayout(busId: string, input: CreateBusLayoutInput): Promise<PublicBusLayout> {
  await getBus(busId);

  const seatNumbers = new Set(input.seats.map((seat) => seat.seatNumber));
  if (seatNumbers.size !== input.seats.length) {
    throw ApiError.badRequest('DUPLICATE_SEAT_NUMBER', 'Seat numbers must be unique within a layout');
  }

  const layout = await prisma.busLayout.create({
    data: {
      busId,
      name: input.name,
      rows: input.rows,
      columns: input.columns,
      deckCount: input.deckCount ?? 1,
      layoutJson: input.seats,
      seats: {
        create: input.seats.map((seat) => ({
          seatNumber: seat.seatNumber,
          row: seat.row,
          column: seat.column,
          deck: seat.deck ?? 'LOWER',
          seatFormat: seat.seatFormat,
          isLadiesSeat: seat.isLadiesSeat ?? false,
          priceMultiplier: seat.priceMultiplier ?? 1.0,
        })),
      },
    },
    include: { seats: true },
  });

  return toPublicBusLayout(layout);
}

export async function listBusLayouts(busId: string): Promise<PublicBusLayout[]> {
  await getBus(busId);
  const layouts = await prisma.busLayout.findMany({
    where: { busId },
    include: { seats: true },
    orderBy: { createdAt: 'asc' },
  });
  return layouts.map(toPublicBusLayout);
}

export async function getBusLayout(busLayoutId: string): Promise<PublicBusLayout> {
  const layout = await prisma.busLayout.findUnique({
    where: { id: busLayoutId },
    include: { seats: true },
  });
  if (!layout) {
    throw ApiError.notFound('Bus layout not found');
  }
  return toPublicBusLayout(layout);
}

// -------------------------------------------------------------------- Routes

export interface PublicRouteStop {
  id: string;
  cityId: string;
  sequence: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
}

export interface PublicRoute {
  id: string;
  operatorId: string;
  sourceCityId: string;
  destinationCityId: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  stops: PublicRouteStop[];
}

function toPublicRouteStop(stop: RouteStop): PublicRouteStop {
  return {
    id: stop.id,
    cityId: stop.cityId,
    sequence: stop.sequence,
    arrivalOffsetMinutes: stop.arrivalOffsetMinutes,
    departureOffsetMinutes: stop.departureOffsetMinutes,
  };
}

function toPublicRoute(route: Route & { stops: RouteStop[] }): PublicRoute {
  return {
    id: route.id,
    operatorId: route.operatorId,
    sourceCityId: route.sourceCityId,
    destinationCityId: route.destinationCityId,
    distanceKm: Number(route.distanceKm),
    estimatedDurationMinutes: route.estimatedDurationMinutes,
    stops: route.stops.map(toPublicRouteStop),
  };
}

async function assertCityExists(cityId: string): Promise<void> {
  const exists = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
  if (!exists) {
    throw ApiError.notFound('City not found');
  }
}

export async function createRoute(input: CreateRouteInput): Promise<PublicRoute> {
  await assertOperatorExists(input.operatorId);
  await Promise.all([assertCityExists(input.sourceCityId), assertCityExists(input.destinationCityId)]);

  const route = await prisma.route.create({
    data: {
      operatorId: input.operatorId,
      sourceCityId: input.sourceCityId,
      destinationCityId: input.destinationCityId,
      distanceKm: input.distanceKm,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      stops: input.stops
        ? {
            create: input.stops.map((stop) => ({
              cityId: stop.cityId,
              sequence: stop.sequence,
              arrivalOffsetMinutes: stop.arrivalOffsetMinutes,
              departureOffsetMinutes: stop.departureOffsetMinutes,
            })),
          }
        : undefined,
    },
    include: { stops: true },
  });

  return toPublicRoute(route);
}

export async function listRoutes(operatorId?: string): Promise<PublicRoute[]> {
  const routes = await prisma.route.findMany({
    where: operatorId ? { operatorId } : undefined,
    include: { stops: { orderBy: { sequence: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return routes.map(toPublicRoute);
}

export async function getRoute(routeId: string): Promise<PublicRoute> {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: { stops: { orderBy: { sequence: 'asc' } } },
  });
  if (!route) {
    throw ApiError.notFound('Route not found');
  }
  return toPublicRoute(route);
}
