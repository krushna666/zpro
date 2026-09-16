import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().datetime().optional(),
  avatarUrl: z.string().trim().url().optional(),
  languagePreference: z.string().trim().min(2).max(10).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const savedPassengerSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  idType: z.string().trim().min(1).max(40).optional(),
  idNumber: z.string().trim().min(1).max(60).optional(),
  isDefault: z.boolean().optional(),
});
export type SavedPassengerInput = z.infer<typeof savedPassengerSchema>;

export const updateSavedPassengerSchema = savedPassengerSchema.partial();
export type UpdateSavedPassengerInput = z.infer<typeof updateSavedPassengerSchema>;
