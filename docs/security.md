# Security

## Rules enforced today (Phase 1)

- **No secrets in the client.** `.env.example` marks every real secret
  `REQUIRED_SECRET_...`; none of them are invented or committed. The
  Android app only ever holds a domain/app-restricted Google Maps key
  (`local.properties`, git-ignored) — never the server Maps key, Razorpay
  secret, DB credentials, or JWT secret.
- **Mock mode cannot reach production.** `backend/src/config/env.ts` throws
  on startup if `NODE_ENV=production` and any of `MOCK_PAYMENTS`,
  `MOCK_OTP`, `MOCK_EMAIL`, `MOCK_WHATSAPP` is `true`.
- **Standard error envelope, no leakage.** Unhandled errors return a generic
  `INTERNAL_ERROR` message; stack traces and internals are logged
  server-side only (Pino), never sent to the client.
- **Structured logging redacts secrets.** `backend/src/lib/logger.ts`
  redacts `Authorization` headers, passwords, OTP/codes, tokens, and
  Razorpay signatures/card numbers from every log line by path pattern.
- **Security headers + CORS allowlist.** Helmet is applied globally; CORS is
  restricted to the explicit `CORS_ORIGINS` list, not `*`.
- **Global + auth + OTP rate limiting** are implemented as reusable
  middleware (`src/middleware/rateLimit.ts`) ready for the auth module to
  apply per-route.
- **JWT verification middleware** (`requireAuth`, `requireRoles`) is in
  place for every future protected route to use; there is no ad-hoc
  token-checking per module.

## Rules the design commits to for later phases

- **Never trust price, seat availability, discount, tax, or payment status
  from the Android client.** The client sends trip ID, seat IDs, passenger
  data and a coupon code; the backend computes and verifies everything else.
  This is why `Booking`'s fare fields are written by the booking service,
  not accepted as request input, in the schema.
- **Payments are confirmed only by a signature-verified Razorpay
  webhook/callback**, idempotently (`Payment.idempotencyKey` is `@unique` in
  the schema specifically so a duplicate webhook delivery can't double-book).
- **Seat booking is race-safe** via a `(tripId, busSeatId)` unique
  constraint on `TripSeat` plus a database transaction around
  verify-then-book, not via application-level locking alone.
- **Refresh-token rotation, Argon2/bcrypt password hashing, OTP
  attempt/rate limits** land with the auth module (Phase 2) and will use
  the `RefreshToken`/`OtpSession` tables already in the schema.
- **RBAC authorization** (`Role`/`Permission`/`UserRole`, operator-scoped
  where relevant) is modeled in the schema now; the enforcing middleware
  (beyond the existing `requireRoles`) is built out with the admin/operator
  modules.

## Known gaps (tracked, not yet closed)

Everything under "Phases 2–10 — not started" in `docs/build-status.md` is a
security gap until it's built and reviewed — most notably: there is no auth
implementation yet (Phase 1 ships only the JWT *verification* middleware,
not token issuance), so no endpoint actually requires a real session yet.
A dedicated security-review pass happens in Phase 10, per the original spec.
