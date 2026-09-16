import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/apiResponse';
import type { BoardingPoint, DroppingPoint } from '@prisma/client';
import type { CreateTripInput } from './trips.schemas';

export interface PublicTripSeat {
  id: string;
  busSeatId: string;
  seatNumber: string;
  row: number;
  column: number;
  deck: string;
  seatFormat: string;
  isLadiesSeat: boolean;
  status: string;
  price: number;
  genderRestriction: string;
}

export interface PublicPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  time: string;
  contactPhone?: string | null;
}

export interface PublicTrip {
  id: string;
  operatorId: string;
  operatorName: string;
  busId: string;
  busName: string;
  routeId: string;
  sourceCityId: string;
  destinationCityId: string;
  departureAt: string;
  arrivalAt: string;
  baseFare: number;
  status: string;
  availableSeatCount: number;
  totalSeatCount: number;
  minFare: number | null;
}

export interface PublicTripDetail extends PublicTrip {
  seats: PublicTripSeat[];
  boardingPoints: PublicPoint[];
  droppingPoints: PublicPoint[];
}

function toPublicPoint(point: BoardingPoint | DroppingPoint): PublicPoint {
  return {
    id: point.id,
    name: point.name,
    address: point.address,
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
    time: point.time.toISOString(),
    contactPhone: 'contactPhone' in point ? point.contactPhone : undefined,
  };
}

export const tripSummaryInclude = Prisma.validator<Prisma.TripInclude>()({
  operator: true,
  bus: true,
  route: { include: { sourceCity: true, destinationCity: true } },
  seats: { select: { status: true, price: true } },
});
type TripWithSummary = Prisma.TripGetPayload<{ include: typeof tripSummaryInclude }>;

export function toPublicTripSummary(trip: TripWithSummary): PublicTrip {
  const availableSeats = trip.seats.filter((seat) => seat.status === 'AVAILABLE');
  const availableFares = availableSeats.map((seat) => Number(seat.price));

  return {
    id: trip.id,
    operatorId: trip.operatorId,
    operatorName: trip.operator.name,
    busId: trip.busId,
    busName: trip.bus.name,
    routeId: trip.routeId,
    sourceCityId: trip.route.sourceCityId,
    destinationCityId: trip.route.destinationCityId,
    departureAt: trip.departureAt.toISOString(),
    arrivalAt: trip.arrivalAt.toISOString(),
    baseFare: Number(trip.baseFare),
    status: trip.status,
    availableSeatCount: availableSeats.length,
    totalSeatCount: trip.seats.length,
    minFare: availableFares.length > 0 ? Math.min(...availableFares) : null,
  };
}

const tripDetailInclude = Prisma.validator<Prisma.TripInclude>()({
  operator: true,
  bus: true,
  route: { include: { sourceCity: true, destinationCity: true } },
  seats: { include: { busSeat: true } },
  boardingPoints: true,
  droppingPoints: true,
});
type TripWithDetail = Prisma.TripGetPayload<{ include: typeof tripDetailInclude }>;

function toPublicTripDetail(trip: TripWithDetail): PublicTripDetail {
  const availableSeats = trip.seats.filter((seat) => seat.status === 'AVAILABLE');

  return {
    id: trip.id,
    operatorId: trip.operatorId,
    operatorName: trip.operator.name,
    busId: trip.busId,
    busName: trip.bus.name,
    routeId: trip.routeId,
    sourceCityId: trip.route.sourceCityId,
    destinationCityId: trip.route.destinationCityId,
    departureAt: trip.departureAt.toISOString(),
    arrivalAt: trip.arrivalAt.toISOString(),
    baseFare: Number(trip.baseFare),
    status: trip.status,
    availableSeatCount: availableSeats.length,
    totalSeatCount: trip.seats.length,
    minFare: availableSeats.length > 0 ? Math.min(...availableSeats.map((seat) => Number(seat.price))) : null,
    seats: trip.seats.map((tripSeat) => ({
      id: tripSeat.id,
      busSeatId: tripSeat.busSeatId,
      seatNumber: tripSeat.busSeat.seatNumber,
      row: tripSeat.busSeat.row,
      column: tripSeat.busSeat.column,
      deck: tripSeat.busSeat.deck,
      seatFormat: tripSeat.busSeat.seatFormat,
      isLadiesSeat: tripSeat.busSeat.isLadiesSeat,
      status: tripSeat.status,
      price: Number(tripSeat.price),
      genderRestriction: tripSeat.genderRestriction,
    })),
    boardingPoints: trip.boardingPoints.map(toPublicPoint),
    droppingPoints: trip.droppingPoints.map(toPublicPoint),
  };
}

export async function createTrip(input: CreateTripInput): Promise<PublicTripDetail> {
  const [operator, bus, route, busLayout] = await Promise.all([
    prisma.operator.findUnique({ where: { id: input.operatorId } }),
    prisma.bus.findUnique({ where: { id: input.busId } }),
    prisma.route.findUnique({ where: { id: input.routeId } }),
    prisma.busLayout.findUnique({ where: { id: input.busLayoutId }, include: { seats: true } }),
  ]);

  if (!operator) throw ApiError.notFound('Operator not found');
  if (!bus) throw ApiError.notFound('Bus not found');
  if (!route) throw ApiError.notFound('Route not found');
  if (!busLayout) throw ApiError.notFound('Bus layout not found');

  if (bus.operatorId !== input.operatorId) {
    throw ApiError.badRequest('BUS_OPERATOR_MISMATCH', 'Bus does not belong to this operator');
  }
  if (route.operatorId !== input.operatorId) {
    throw ApiError.badRequest('ROUTE_OPERATOR_MISMATCH', 'Route does not belong to this operator');
  }
  if (busLayout.busId !== input.busId) {
    throw ApiError.badRequest('LAYOUT_BUS_MISMATCH', 'Bus layout does not belong to this bus');
  }
  if (busLayout.seats.length === 0) {
    throw ApiError.badRequest('EMPTY_LAYOUT', 'This bus layout has no seats to sell');
  }

  const trip = await prisma.trip.create({
    data: {
      operatorId: input.operatorId,
      busId: input.busId,
      routeId: input.routeId,
      busLayoutId: input.busLayoutId,
      cancellationPolicyId: input.cancellationPolicyId,
      departureAt: new Date(input.departureAt),
      arrivalAt: new Date(input.arrivalAt),
      baseFare: input.baseFare,
      seats: {
        create: busLayout.seats.map((seat) => ({
          busSeatId: seat.id,
          price: seat.priceMultiplier.times(input.baseFare),
        })),
      },
      boardingPoints: {
        create: input.boardingPoints.map((point) => ({ ...point, time: new Date(point.time) })),
      },
      droppingPoints: {
        create: input.droppingPoints.map((point) => ({ ...point, time: new Date(point.time) })),
      },
    },
    include: tripDetailInclude,
  });

  return toPublicTripDetail(trip);
}

export async function getTripDetail(tripId: string): Promise<PublicTripDetail> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: tripDetailInclude });
  if (!trip) {
    throw ApiError.notFound('Trip not found');
  }
  return toPublicTripDetail(trip);
}
