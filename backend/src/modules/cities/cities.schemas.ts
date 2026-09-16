import { z } from 'zod';

export const citySearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
});
export type CitySearchQuery = z.infer<typeof citySearchQuerySchema>;

export const cityListQuerySchema = z.object({
  popular: z.enum(['true', 'false']).optional(),
});
export type CityListQuery = z.infer<typeof cityListQuerySchema>;
