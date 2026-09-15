# Database

PostgreSQL via Prisma. Full schema: `backend/prisma/schema.prisma`. UUID
primary keys throughout; `createdAt`/`updatedAt` on every mutable table;
foreign keys and unique constraints enforced at the database level (not just
in application code).

## Table groups

| Group | Tables |
|---|---|
| Identity / RBAC | `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `RefreshToken`, `OtpSession` |
| Operators | `Operator`, `OperatorUser` |
| Geography | `City`, `Location` |
| Routes / buses | `Route`, `RouteStop`, `BusType`, `Bus`, `BusLayout`, `BusSeat` |
| Trips / inventory | `CancellationPolicy`, `Trip`, `TripStop`, `BoardingPoint`, `DroppingPoint`, `TripSeat`, `SeatLock`, `TripLiveLocation`, `TripLocationPing` |
| Bookings / payments | `SavedPassenger`, `Booking`, `BookingSeat`, `BookingPassenger`, `Payment`, `Refund` |
| Commerce | `Coupon`, `CouponRedemption`, `Promotion`, `Referral` |
| Community | `Review`, `Notification`, `DeviceToken`, `SupportTicket`, `SupportMessage` |
| System | `AuditLog`, `Setting` |

## Why some tables are shaped the way they are

- **`TripSeat`** is the per-trip seat inventory row (not `BusSeat`, which is
  the bus's physical layout template). This is what seat locking and
  booking actually mutate — `@@unique([tripId, busSeatId])` is what makes a
  double-booking of the same seat on the same trip a constraint violation,
  not just an application bug.
- **`SeatLock`** has `tripSeatId` as `@unique` — at most one active lock per
  seat, mirroring the Redis TTL lock that's authoritative for expiry.
- **`Coupon.applicableOperatorIds` / `applicableRouteIds`** are JSON arrays
  rather than join tables, since coupon applicability rules are read far
  more often than written and don't need relational integrity against
  operators/routes being deleted.
- **RBAC** is modeled as real `Role`/`Permission`/`RolePermission`/`UserRole`
  tables (not a hardcoded enum) so operator-scoped roles work:
  `UserRole.operatorId` is nullable — null for platform-wide roles
  (`SUPER_ADMIN`, `ADMIN`, `SUPPORT`), set for operator-scoped roles
  (`OPERATOR_ADMIN`, `OPERATOR_STAFF`, `DRIVER`).

## Migrations

```bash
cd backend
npx prisma migrate dev --name <description>   # dev: creates + applies a migration
npx prisma migrate deploy                       # prod: applies pending migrations only
npx prisma studio                                # browse data
```

The `20260915075923_init` migration (in `backend/prisma/migrations/`) is the
Phase 1 baseline — verified by applying it against a real PostgreSQL 16
instance and then running the seed script successfully.

## Seed data

`backend/prisma/seed.ts` seeds: all RBAC roles/permissions from the spec,
the 10 launch cities (Mumbai, Pune, Delhi, Bangalore, Hyderabad, Ahmedabad,
Jaipur, Surat, Nashik, Indore), and a dev `SUPER_ADMIN` user
(`admin@busgo.app`). Operators/buses/layouts/routes/trips/boarding-dropping
points/coupons are seeded starting Phase 3, once those modules exist.
