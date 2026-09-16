import { Prisma } from '@prisma/client';

export const userInclude = Prisma.validator<Prisma.UserInclude>()({
  roles: { include: { role: true } },
});
export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export interface PublicUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  avatarUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  phoneVerifiedAt: string | null;
  emailVerifiedAt: string | null;
  languagePreference: string;
}

export function toPublicUser(user: UserWithRoles): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    roles: user.roles.map((userRole) => userRole.role.name),
    avatarUrl: user.avatarUrl,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
    phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    languagePreference: user.languagePreference,
  };
}
