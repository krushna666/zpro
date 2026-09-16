import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/apiResponse';
import type { SavedPassenger } from '@prisma/client';
import { toPublicUser, userInclude, type PublicUser } from './user.mapper';
import type { SavedPassengerInput, UpdateProfileInput, UpdateSavedPassengerInput } from './users.schemas';

export interface PublicSavedPassenger {
  id: string;
  fullName: string;
  age: number;
  gender: string;
  idType: string | null;
  idNumber: string | null;
  isDefault: boolean;
}

function toPublicPassenger(passenger: SavedPassenger): PublicSavedPassenger {
  return {
    id: passenger.id,
    fullName: passenger.fullName,
    age: passenger.age,
    gender: passenger.gender,
    idType: passenger.idType,
    idNumber: passenger.idNumber,
    isDefault: passenger.isDefault,
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: input.fullName,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      avatarUrl: input.avatarUrl,
      languagePreference: input.languagePreference,
    },
    include: userInclude,
  });
  return toPublicUser(user);
}

export async function listSavedPassengers(userId: string): Promise<PublicSavedPassenger[]> {
  const passengers = await prisma.savedPassenger.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return passengers.map(toPublicPassenger);
}

export async function createSavedPassenger(
  userId: string,
  input: SavedPassengerInput,
): Promise<PublicSavedPassenger> {
  if (input.isDefault) {
    await prisma.savedPassenger.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }
  const passenger = await prisma.savedPassenger.create({
    data: {
      userId,
      fullName: input.fullName,
      age: input.age,
      gender: input.gender,
      idType: input.idType,
      idNumber: input.idNumber,
      isDefault: input.isDefault ?? false,
    },
  });
  return toPublicPassenger(passenger);
}

async function assertOwnedPassenger(userId: string, passengerId: string): Promise<SavedPassenger> {
  const passenger = await prisma.savedPassenger.findUnique({ where: { id: passengerId } });
  if (!passenger || passenger.userId !== userId) {
    throw ApiError.notFound('Saved passenger not found');
  }
  return passenger;
}

export async function updateSavedPassenger(
  userId: string,
  passengerId: string,
  input: UpdateSavedPassengerInput,
): Promise<PublicSavedPassenger> {
  await assertOwnedPassenger(userId, passengerId);

  if (input.isDefault) {
    await prisma.savedPassenger.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  const passenger = await prisma.savedPassenger.update({
    where: { id: passengerId },
    data: {
      fullName: input.fullName,
      age: input.age,
      gender: input.gender,
      idType: input.idType,
      idNumber: input.idNumber,
      isDefault: input.isDefault,
    },
  });
  return toPublicPassenger(passenger);
}

export async function deleteSavedPassenger(userId: string, passengerId: string): Promise<void> {
  await assertOwnedPassenger(userId, passengerId);
  await prisma.savedPassenger.delete({ where: { id: passengerId } });
}
