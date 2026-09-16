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

## Phases 2–10 — not started

Auth (OTP/email/password/Google, refresh rotation), users/saved passengers,
cities/search, operators/buses/routes/trips/seat layouts, seat
locking+booking+fare calc, Razorpay+webhooks+ticket PDF+QR, maps/boarding-
dropping points/live tracking, notifications/email/WhatsApp, admin+operator
CRUD screens+reports, reviews/offers/coupons/referral/support, and the
testing/security/perf/CI-CD/production-deployment pass — per the phase plan
in the original spec. Each will update this file when it lands.
