import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const DEV_ADMIN_PASSWORD = 'ChangeMe123!';

const CORE_PERMISSIONS = [
  'USER_READ',
  'USER_UPDATE',
  'OPERATOR_MANAGE',
  'BUS_MANAGE',
  'TRIP_MANAGE',
  'BOOKING_READ',
  'BOOKING_UPDATE',
  'PAYMENT_READ',
  'REFUND_MANAGE',
  'COUPON_MANAGE',
  'REPORT_READ',
  'SUPPORT_MANAGE',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: CORE_PERMISSIONS,
  ADMIN: CORE_PERMISSIONS,
  OPERATOR_ADMIN: ['BUS_MANAGE', 'TRIP_MANAGE', 'BOOKING_READ', 'BOOKING_UPDATE', 'REPORT_READ'],
  OPERATOR_STAFF: ['BOOKING_READ', 'TRIP_MANAGE'],
  DRIVER: ['TRIP_MANAGE'],
  SUPPORT: ['SUPPORT_MANAGE', 'BOOKING_READ'],
  CUSTOMER: [],
};

async function main(): Promise<void> {
  console.log('Seeding roles and permissions...');

  const permissionRecords = await Promise.all(
    CORE_PERMISSIONS.map((code) =>
      prisma.permission.upsert({ where: { code }, update: {}, create: { code } }),
    ),
  );
  const permissionByCode = new Map(permissionRecords.map((p) => [p.code, p]));

  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const code of permissionCodes) {
      const permission = permissionByCode.get(code);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seeding cities...');
  const cities: Array<{ name: string; state: string; lat: number; lng: number }> = [
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
    { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
    { name: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
    { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
    { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
    { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
    { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name_state: { name: city.name, state: city.state } },
      update: {},
      create: {
        name: city.name,
        state: city.state,
        latitude: city.lat,
        longitude: city.lng,
        isPopular: true,
      },
    });
  }

  console.log('Seeding development admin user...');
  const passwordHash = await argon2.hash(DEV_ADMIN_PASSWORD);
  await prisma.user.upsert({
    where: { email: 'admin@busgo.app' },
    update: { passwordHash },
    create: {
      email: 'admin@busgo.app',
      passwordHash,
      fullName: 'BusGo Admin',
      referralCode: 'BUSGOADMIN',
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
      roles: {
        create: {
          role: { connect: { name: 'SUPER_ADMIN' } },
        },
      },
    },
  });

  console.log(`Seed complete. Dev admin login: admin@busgo.app / ${DEV_ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
