import { z } from 'zod';

export const searchTripsQuerySchema = z.object({
  fromCityId: z.string().uuid(),
  toCityId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});
export type SearchTripsQuery = z.infer<typeof searchTripsQuerySchema>;
