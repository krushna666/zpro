# Architecture

## Components

```
Android app (Kotlin, Compose, MVVM)
        │  HTTPS (Retrofit/OkHttp)
        ▼
Nginx (reverse proxy, TLS termination in prod)
        │
        ▼
Backend API (Node.js + TypeScript + Express)
  ├── Controller → Service → Repository (Prisma) layering per module
  ├── REST /api/v1/*  +  WebSocket /ws/tracking/:tripId
        │
        ├──▶ PostgreSQL (Prisma)   — system of record
        ├──▶ Redis                — seat locks (TTL), rate limiting, caches
        └──▶ External services
               ├── Razorpay        (orders, payments, refunds, webhooks)
               ├── Google Maps     (geocoding/places/directions — server key)
               ├── Firebase (FCM)  (push notifications)
               ├── Email (SMTP/Resend/SendGrid)
               ├── WhatsApp (Twilio / Meta Cloud API)
               └── Supabase/S3     (file storage — profile photos, ticket PDFs)

Admin panel (React + Vite + Tailwind) — talks to the same REST API, admin-role-gated.
```

## Backend module layering

Each backend module (`auth`, `users`, `cities`, `search`, `bookings`,
`payments`, …) follows:

```
routes/v1/<module>/           → Express Router: validates input (Zod), calls service
  ├── <module>.controller.ts
  ├── <module>.service.ts     → business logic, orchestrates repository + external clients
  ├── <module>.repository.ts  → Prisma queries, isolated so services stay testable
  └── <module>.schema.ts      → Zod request/response schemas
```

`src/routes/v1/index.ts` is the single mount point; modules are added there
as they're implemented (see `docs/build-status.md` for what's live).

## Money and availability are always server-authoritative

The Android client sends trip ID, seat IDs, passenger info and a coupon
code. The backend — never the client — computes seat availability, fare,
discount, tax and the final amount, and is the only thing that can confirm a
payment or a booking. See `docs/security.md`.

## Seat inventory & locking

`TripSeat` rows (one per seat per trip) hold `status`
(`AVAILABLE|LOCKED|BOOKED|BLOCKED`), `price`, `genderRestriction`, and
`lockedUntil`/`lockedByUserId`. Redis holds the authoritative TTL for an
active lock (`SEAT_LOCK_TTL_SECONDS`, default 300s); the `SeatLock` Postgres
table mirrors it for auditability/recovery. Seat confirmation happens inside
a single Postgres transaction (verify availability → mark `BOOKED` → create
the booking) with a unique constraint on `(tripId, busSeatId)` so a race
between two booking attempts for the same seat cannot both win — this is the
concurrency guarantee the seat-locking test suite (Phase 4/10) verifies.

## State machines

- **Booking**: `INITIATED → SEATS_LOCKED → PAYMENT_PENDING → PAYMENT_SUCCESS
  → CONFIRMED`, with `CANCELLED`, `REFUND_PENDING`, `REFUNDED`, `EXPIRED`,
  `FAILED` as the other reachable states. Enforced in the bookings service —
  invalid transitions are rejected, not silently allowed.
- **Payment**: `CREATED → PENDING → AUTHORIZED → CAPTURED`, with `FAILED`,
  `REFUND_PENDING`, `REFUNDED`.
- **Trip**: `SCHEDULED → BOARDING → IN_TRANSIT → ARRIVED → COMPLETED`, or
  `CANCELLED`.

## Payments (Razorpay)

```
Android → Backend (create booking, lock seats) → Backend creates Razorpay order
  → Android opens Razorpay checkout → Razorpay → Backend webhook (signature-verified)
  → Backend confirms booking (idempotent on razorpayOrderId / a payment
    idempotency key) → PDF ticket + notification
```

The Android client's own "payment succeeded" callback is never trusted to
confirm a booking by itself — only the signature-verified webhook (or a
signature-verified client callback used purely to *poll* booking status)
does that.
