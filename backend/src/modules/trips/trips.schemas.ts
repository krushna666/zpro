import { z } from 'zod';

const pointInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().min(1).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  time: z.string().datetime(),
});

const boardingPointInputSchema = pointInputSchema.extend({
  contactPhone: z.string().trim().min(6).max(20).optional(),
});

export const createTripSchema = z
  .object({
    operatorId: z.string().uuid(),
    busId: z.string().uuid(),
    routeId: z.string().uuid(),
    busLayoutId: z.string().uuid(),
    cancellationPolicyId: z.string().uuid().optional(),
    departureAt: z.string().datetime(),
    arrivalAt: z.string().datetime(),
    baseFare: z.number().positive(),
    boardingPoints: z.array(boardingPointInputSchema).min(1).max(20),
    droppingPoints: z.array(pointInputSchema).min(1).max(20),
  })
  .refine((data) => new Date(data.arrivalAt) > new Date(data.departureAt), {
    message: 'arrivalAt must be after departureAt',
    path: ['arrivalAt'],
  });
export type CreateTripInput = z.infer<typeof createTripSchema>;
