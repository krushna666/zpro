# Build status

BusGo is being built in the 10 phases described in the original spec. This
file is the source of truth for what's real and working today versus what's
scaffolded for a later phase. Keep it updated at the end of every phase.

## Phase 1 — Foundation (complete)

**Backend** (`backend/`)
- Express + TypeScript app with the standard `{success, data, message}` /
  `{success: false, error: {code, message}}` response envelope, structured
  Pino logging with secret redaction, request IDs, Helmet, CORS, global rate
  limiting, centralized error handling.
- Zod-validated environment config (`src/config/env.ts`) that hard-fails
  startup if required secrets are missing, and refuses to boot in production
  with any `MOCK_*` flag on.
- Full Prisma schema (`prisma/schema.prisma`) covering identity/RBAC,
  operators, geography, routes/buses/bus layouts, trips/seat
  inventory/seat locks, bookings/passengers/payments/refunds,
  coupons/promotions/referrals, reviews/notifications/support/device
  tokens, and audit/settings — see `docs/database.md`.
- JWT auth middleware (`requireAuth`, `requireRoles`) ready for the auth
  module to issue tokens into.
- **Verified for real**: `npx prisma migrate dev` applied cleanly against a
  live PostgreSQL 16 database; `npx prisma db seed` populated roles,
  permissions, 10 cities and a dev admin user; the built server
  (`npm run build && npm start`) served `GET /api/v1/health` and a 404
  envelope end-to-end against real Postgres + Redis; `npm run typecheck`,
  `npm run lint`, and `npm test` (vitest + supertest) all pass clean.
- Not yet implemented: every `/auth`, `/users`, `/search`, `/trips`,
  `/bookings`, `/payments`, `/coupons`, `/reviews`, `/notifications`,
  `/support`, `/admin` route — these are Phases 2–9. `src/routes/v1/index.ts`
  has the mount points commented in for each, in build order.

**Admin panel** (`admin/`)
- React 19 + TypeScript + Vite 8 + Tailwind v4, React Router, Axios API
  client with bearer-token interceptor, an auth context backed by
  `localStorage`, a protected-route shell with sidebar navigation covering
  every module in the spec (Operators, Buses, Bus Layouts, Routes, Trips,
  Seats, Bookings, Payments, Refunds, Coupons, Offers, Users, Reviews,
  Support, Notifications, Reports, Audit Logs, Settings).
- Login page posts to `POST /auth/login` (lands with Phase 2). Dashboard page
  is live today: it calls `GET /api/v1/health` and shows API online/offline
  status, plus a sample Recharts revenue/bookings chart wired for real data
  once the reports module exists.
- **Verified for real**: `npm run build` produces a working production
  bundle; `vite preview` served it and returned the expected HTML shell;
  `npm run lint` (oxlint) passes with only a non-blocking fast-refresh
  warning.
- Every module route beyond Dashboard is a `PlaceholderPage` until its
  backend module and admin CRUD screens are built (Phases 8–9).

**Android app** (`android/BusGoAndroid/`)
- Gradle Kotlin DSL project, version catalog (`gradle/libs.versions.toml`)
  pinning AGP, Kotlin, Compose BOM, Hilt, Retrofit/OkHttp,
  kotlinx.serialization, Room, DataStore, Coil, Maps Compose, Play Services
  Location, Firebase BOM.
- MVVM/Clean-ish structure: `core/theme` (Material 3, light/dark, dynamic
  color), `core/navigation` (Navigation Compose graph: Splash → Onboarding →
  Login → OTP → Home, IDs-only route args), `core/network` (Retrofit +
  OkHttp, `AuthInterceptor`, `TokenAuthenticator`, `NetworkResult` sealed
  class, the shared API success/error envelope types matching the backend),
  `data/local` (Room `AppDatabase` with `CachedCity`, `RecentSearch`,
  `CachedBooking` entities/DAOs; DataStore-backed `SessionDataStore`), `di`
  (Hilt modules for network/database/datastore), `ui/splash` (real
  `SplashViewModel` that reads session state from DataStore and routes to
  Home or Login), `ui/onboarding`, `ui/auth` (phone entry + OTP screens,
  UI-complete, wired to nothing yet), `ui/home` (shell).
- Localization scaffolding: `values/strings.xml`, `values-hi/strings.xml`,
  `values-mr/strings.xml` — no hardcoded UI strings in the screens that
  exist. Dark mode via `values-night/`.
- FCM messaging service class registered in the manifest (`onNewToken` /
  `onMessageReceived` wired up structurally; device-token registration and
  channel routing land with the notifications module).
- **Known limitation, verified**: this code was written and reviewed but
  **not compiled**. The sandbox this was built in blocks `dl.google.com`
  at the network policy level (`maven.google.com` 301-redirects there for
  Android Gradle Plugin artifacts and all SDK components), so
  `./gradlew assembleDebug` cannot resolve the Android Gradle Plugin at all
  in that environment — confirmed via direct `curl` (403 from the egress
  proxy) and via `gradle wrapper`, which failed at plugin resolution before
  even generating wrapper files (the wrapper committed here was generated
  from an AGP-free scratch project and copied in). Build this on a machine
  with normal internet access and Android Studio / the Android SDK
  installed; there is no reason to expect it won't compile, but that claim
  is unverified until someone runs it for real.

**Firebase** (`redbus-cb9c3`)
- The Android app is registered in the Firebase project (`com.busgo.app`,
  app ID `1:603499598206:android:3a29b1d4b1b102da91632f`), the
  `google-services` Gradle plugin is applied
  (`android/BusGoAndroid/{build.gradle.kts,app/build.gradle.kts}`), and its
  `google-services.json` has been fetched — it's git-ignored locally per
  `google-services.json.example`, so anyone else building the app needs to
  fetch their own copy (see the README's Firebase setup section).
- Firebase Hosting is configured (`firebase.json` / `.firebaserc` at the repo
  root) to serve the admin panel's static build (`admin/dist`) and has been
  deployed once: https://redbus-cb9c3.web.app. That panel is still
  Phase-1-only (login posts to a backend that isn't deployed anywhere
  reachable from that URL, and every module past Dashboard is a
  placeholder) — the live URL exists, but it isn't yet a usable admin tool.

## Phase 2 — Auth (mostly complete)

**Backend** (`backend/src/modules/auth/`)
- `POST /auth/otp/request` + `POST /auth/otp/verify`: phone-based passwordless
  login/register. OTP codes are argon2-hashed (`OtpSession`), rate-limited
  (`otpRateLimiter`), capped at 5 verify attempts, and expire after 5 minutes.
  A new phone number auto-creates a `CUSTOMER` user with a unique referral
  code; delivery is mock-only today (`MOCK_OTP`/`DEV_OTP_CODE`) — there's no
  real SMS provider wired in yet, so production needs one before this is
  usable outside dev (see `src/lib/otp.ts`).
- `POST /auth/register` / `POST /auth/login`: email + argon2-hashed password,
  used by the admin panel and available for any user.
- `POST /auth/refresh`: rotates the refresh token on every use and stores
  only its SHA-256 hash (`RefreshToken`); reusing an already-rotated or
  expired token revokes the entire session family (theft-response pattern).
- `POST /auth/logout`, `GET /auth/me`.
- **Not implemented**: Google sign-in and password-reset-via-OTP — deferred
  out of this pass, both are natural follow-ups.
- **Verified for real**: `npx prisma migrate dev` + `db seed` against live
  Postgres, full flow driven with `curl` against a running `npm run dev`
  server (OTP request → verify → new user created; wrong code rejected;
  wrong password rejected; refresh rotation; reuse-detection revokes the
  session family; logout revokes the token), plus `tests/auth.test.ts`
  (8 tests, vitest + supertest, real Postgres) covering the same. `npm run
  typecheck`, `npm run lint`, and `npm test` all pass clean.

**Admin panel** (`admin/`)
- `Login.tsx` now stores the refresh token too; `apiClient.ts` gained a
  response interceptor that transparently refreshes on a 401 and retries the
  original request once, clearing the session and bouncing to `/login` if
  the refresh itself fails. `AuthContext.logout()` best-effort revokes the
  refresh token server-side.
- **Verified for real**: driven through an actual Chromium browser
  (Playwright) against the live backend — login redirects to the dashboard,
  tokens land in `localStorage`, the session survives a full page reload,
  and logout clears it and returns to `/login`.

**Android app** (`android/BusGoAndroid/`)
- `LoginScreen`/`OtpScreen` now call the real endpoints via new
  `LoginViewModel`/`OtpViewModel` (loading state, inline errors, a 30s resend
  cooldown), persist the session in `SessionDataStore` on success, and
  navigate to Home. `TokenAuthenticator` now actually calls `POST
  auth/refresh` on a 401 (via its own bare `OkHttpClient` to avoid recursing
  through itself) and retries the original request once before falling back
  to clearing the session.
- **Known limitation, unverified**: written and reviewed like the rest of the
  Android app, but still **not compiled** — this sandbox still blocks
  `dl.google.com`/`maven.google.com` (confirmed again this session), so
  Gradle can't resolve the Android Gradle Plugin. Build and exercise this on
  a machine with normal internet access before trusting it further.

## Phase 3 — Users/saved passengers, cities/search (backend complete)

**Backend**
- `src/modules/users/`: `PATCH /users/me` (profile: name, gender, DOB,
  avatar, language); `GET/POST/PATCH/DELETE /users/me/saved-passengers`,
  ownership-checked (a passenger not owned by the caller 404s rather than
  leaking existence), with only one `isDefault` passenger kept per user.
  `user.mapper.ts` now holds the shared `PublicUser`/`toPublicUser` used by
  both `/auth/me` and this module (previously duplicated in `auth.service`).
- `src/modules/cities/`: `GET /cities` (optional `?popular=true`), `GET
  /cities/search?q=` (case-insensitive partial match, capped at 20) — both
  public, no auth required. Prisma's `Decimal` lat/lng are converted to
  plain numbers in the response so clients don't have to parse strings.
- **Verified for real**: `tests/users.test.ts` + `tests/cities.test.ts` (10
  new tests: profile update, saved-passenger CRUD, cross-user ownership
  denial, single-default enforcement, city list/filter/search, validation
  rejection) against the same live Postgres, alongside the existing auth
  suite — 18 tests total, all green. `npm run typecheck` and `npm run lint`
  pass clean.
- **Not done yet**: the Android city picker / search UI and the admin Users
  list screen aren't wired to these endpoints — `CityDao`/`CachedCity` in
  the Android app are still waiting for a repository to populate them, and
  Admin's `/users` route is still `PlaceholderPage`. Natural next slices.

## Phase 4 — Operators/buses/routes/trips/seat layouts (backend complete)

**Backend**
- `src/modules/catalog/`: admin-only (`SUPER_ADMIN`/`ADMIN`) authoring —
  `POST/GET/PATCH /operators`, `POST /bus-types` (+public `GET`),
  `POST /operators/:operatorId/buses`, `GET/PATCH /buses/:busId`,
  `POST/GET /buses/:busId/layouts` (seats created together with the layout,
  duplicate seat numbers within one layout rejected), `POST/GET /routes`
  (with optional `RouteStop`s). Uniqueness conflicts (slug, registration
  number, bus-type name) return typed 409s instead of raw Prisma errors.
- `src/modules/trips/`: admin `POST /trips` validates the bus/route/layout
  actually belong to the given operator (`BUS_OPERATOR_MISMATCH` /
  `ROUTE_OPERATOR_MISMATCH` / `LAYOUT_BUS_MISMATCH`), then generates one
  `TripSeat` per `BusSeat` in the layout with `price = baseFare ×
  seat.priceMultiplier` — this is the only place seat inventory gets
  created. Public `GET /trips/:tripId` returns the full seat map +
  boarding/dropping points.
- `src/modules/search/`: public `GET /search/trips?fromCityId&toCityId&date`
  — direct-route matching only (`Route.sourceCityId`/`destinationCityId`),
  scoped to `SCHEDULED` trips departing that calendar day. Deliberately
  doesn't do intermediate-stop matching (a trip whose `RouteStop`s pass
  through a city isn't found by searching that city as source/destination)
  — flagged as a known gap rather than attempted half-way.
- Seed data: a demo operator/bus/2+2 layout (40 seats) and a Mumbai→Pune
  route with two trips (tomorrow 08:00 and 20:00), so search returns real
  results out of the box. `prisma db seed` is idempotent — re-running it
  doesn't duplicate the demo trips.
- **Verified for real**: full admin authoring flow driven with `curl`
  against a running server (operator → bus type → bus → layout with a
  1.5× price-multiplier seat → route → trip, confirmed the multiplier
  actually priced that one seat higher), plus the seeded Mumbai→Pune
  search returning both demo trips with correct fares and seat counts, plus
  `GET /trips/:id` returning the full seat map. `tests/catalog.test.ts` (6
  tests, including the operator-mismatch rejection and an end-to-end
  operator→trip build) brings the suite to 24 tests, all green against
  real Postgres. `npm run typecheck` and `npm run lint` pass clean.
- **Not done yet**: no admin UI for any of this (Buses/Routes/Trips are
  still `PlaceholderPage` in the admin panel), and the Android app has no
  search/bus-list/seat-selection screens wired up yet — `HomeScreen` is
  still just a header. Seat *locking* (the `SeatLock` model) is Phase 5's
  job, not this one — nothing here reserves a seat, it only lists them.

## Phases 5–10 — not started

Seat locking+booking+fare calc, Razorpay+webhooks+ticket PDF+QR,
maps/boarding-dropping points/live tracking, notifications/email/WhatsApp,
admin+operator CRUD screens+reports, reviews/offers/coupons/referral/support,
and the testing/security/perf/CI-CD/production-deployment pass — per the
phase plan in the original spec. Each will update this file when it lands.
