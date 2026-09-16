import { z } from 'zod';

export const createOperatorSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  logoUrl: z.string().trim().url().optional(),
  contactEmail: z.string().trim().toLowerCase().email().optional(),
  contactPhone: z.string().trim().min(6).max(20).optional(),
  gstNumber: z.string().trim().min(1).max(20).optional(),
  address: z.string().trim().min(1).max(300).optional(),
});
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;

export const updateOperatorSchema = createOperatorSchema.partial().extend({
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>;

export const createBusTypeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(['SEATER', 'SLEEPER', 'SEMI_SLEEPER']),
  isAc: z.boolean(),
  description: z.string().trim().max(300).optional(),
});
export type CreateBusTypeInput = z.infer<typeof createBusTypeSchema>;

export const createBusSchema = z.object({
  registrationNumber: z.string().trim().toUpperCase().min(1).max(20),
  name: z.string().trim().min(1).max(120),
  busTypeId: z.string().uuid(),
  totalSeats: z.number().int().min(1).max(80),
  amenities: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  photos: z.array(z.string().trim().url()).max(20).optional(),
});
export type CreateBusInput = z.infer<typeof createBusSchema>;

export const updateBusSchema = createBusSchema.partial();
export type UpdateBusInput = z.infer<typeof updateBusSchema>;

const busSeatInputSchema = z.object({
  seatNumber: z.string().trim().min(1).max(10),
  row: z.number().int().min(1),
  column: z.number().int().min(1),
  deck: z.enum(['LOWER', 'UPPER']).optional(),
  seatFormat: z.enum(['SEATER', 'SLEEPER', 'SEMI_SLEEPER']),
  isLadiesSeat: z.boolean().optional(),
  priceMultiplier: z.number().min(0.1).max(10).optional(),
});

export const createBusLayoutSchema = z.object({
  name: z.string().trim().min(1).max(80),
  rows: z.number().int().min(1).max(50),
  columns: z.number().int().min(1).max(10),
  deckCount: z.number().int().min(1).max(2).optional(),
  seats: z.array(busSeatInputSchema).min(1).max(80),
});
export type CreateBusLayoutInput = z.infer<typeof createBusLayoutSchema>;

const routeStopInputSchema = z.object({
  cityId: z.string().uuid(),
  sequence: z.number().int().min(1),
  arrivalOffsetMinutes: z.number().int().min(0),
  departureOffsetMinutes: z.number().int().min(0),
});

export const createRouteSchema = z
  .object({
    operatorId: z.string().uuid(),
    sourceCityId: z.string().uuid(),
    destinationCityId: z.string().uuid(),
    distanceKm: z.number().positive(),
    estimatedDurationMinutes: z.number().int().positive(),
    stops: z.array(routeStopInputSchema).max(20).optional(),
  })
  .refine((data) => data.sourceCityId !== data.destinationCityId, {
    message: 'Source and destination cities must be different',
    path: ['destinationCityId'],
  });
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
