# BusGo

A bus-ticket booking platform: native Android app, Node.js/TypeScript backend,
React admin panel, PostgreSQL + Prisma, Redis, Docker Compose.

> **Build status: Phase 3 of 10 (users/cities) backend complete.** See
> [`docs/build-status.md`](docs/build-status.md) for exactly what's implemented,
> what's scaffolded-but-unwired, and what's still to come. This is a large,
> multi-phase build (see that doc for the phase plan); this README documents
> what exists today and how to run it.

## Monorepo layout

```
busgo/
├── android/BusGoAndroid/   # Kotlin + Jetpack Compose app (com.busgo.app)
├── backend/                # Node.js + TypeScript + Express + Prisma API
├── admin/                  # React + TypeScript + Vite + Tailwind admin panel
├── infra/nginx/            # Reverse proxy config for docker-compose
├── docs/                   # Architecture, API, deployment docs
├── docker-compose.yml
└── .env.example
```

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16 and Redis (via Docker, or installed locally)
- Docker + Docker Compose (for containerized dev/prod)
- JDK 17 and Android Studio (Hedgehog+) with Android SDK 34 for the Android app
- A Razorpay account (test mode is fine), Firebase project, Google Maps API keys
  for the integrations that need real credentials — see [Environment variables](#environment-variables)

## Environment variables

Copy `.env.example` to `.env` at the repo root and fill in real values. Every
value that must be a genuine secret is marked `REQUIRED_SECRET_...` in the
example file — do not invent these; get them from the relevant provider
(Razorpay, Firebase, Supabase, SMTP/Resend/SendGrid, Twilio/Meta WhatsApp,
Google Maps). For local development without those providers, the `MOCK_*`
flags in `.env.example` let auth/payments/email/WhatsApp run in a safe
development mode — **these must never be `true` in production** (the backend
refuses to boot in `NODE_ENV=production` if any mock flag is on).

The admin panel reads `admin/.env` (see `admin/.env.example`) for
`VITE_API_BASE_URL`. The Android app reads Maps/API configuration from
`android/BusGoAndroid/local.properties` (see `local.properties.example`) —
**never** put server-side secrets there; only a client-restricted Google Maps
Android key belongs in the app.

## Running with Docker Compose

```bash
cp .env.example .env    # fill in real values as needed
docker compose up -d postgres redis
docker compose up -d backend admin nginx
```

- API: `http://localhost:4000/api/v1` (or via nginx: `http://localhost:8080/api/`)
- Admin: `http://localhost:5173` (or via nginx: `http://localhost:8080/`)

> Note: pulling `postgres:16-alpine` / `redis:7-alpine` / `nginx:1.27-alpine`
> requires egress to Docker Hub, which some sandboxed/CI environments block.
> If `docker compose pull` fails, run Postgres/Redis as local services instead
> (see below) and run the backend/admin with `npm run dev`.

## Running backend locally (without Docker)

```bash
# Postgres + Redis running locally (or via docker compose up -d postgres redis)
cd backend
npm install
cp ../.env.example .env   # or export the same variables in your shell
npx prisma generate
npx prisma migrate dev        # creates the schema
npx prisma db seed            # cities, roles/permissions, dev admin user
npm run dev                   # http://localhost:4000
```

## Auth

- Email/password: the seeded dev admin is `admin@busgo.app` / `ChangeMe123!`
  (`POST /auth/login`) — this is what the admin panel's login page uses.
- Phone OTP (used by the Android app): `POST /auth/otp/request` with a
  10-digit Indian mobile number, then `POST /auth/otp/verify`. With
  `MOCK_OTP=true` (the `.env.example` default) no real SMS is sent — the code
  is always `DEV_OTP_CODE` (`123456` by default) and is also echoed back as
  `devCode` in the request response for convenience. A first-time phone
  number is auto-registered as a new `CUSTOMER` account on verify.
- See [`docs/build-status.md`](docs/build-status.md) for what's implemented
  (refresh rotation with reuse detection, logout, `/auth/me`) versus deferred
  (Google sign-in, password reset).

Other backend commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build && npm start    # production build
npx prisma studio             # inspect the database
```

**Windows PowerShell** equivalents: `Copy-Item ..\.env.example .env`, then the
same `npm`/`npx` commands work unchanged in PowerShell.

## Running the admin panel locally

```bash
cd admin
npm install
cp .env.example .env      # VITE_API_BASE_URL, defaults to localhost:4000
npm run dev                # http://localhost:5173
npm run build               # production build to admin/dist
```

Sign-in currently posts to `POST /auth/login`, which lands with the auth
backend module (Phase 2) — the dashboard shell, navigation and every admin
module route are scaffolded and build today; `GET /api/v1/health` is already
wired end-to-end as a live connectivity check on the dashboard.

## Android app

```bash
cd android/BusGoAndroid
cp local.properties.example local.properties   # set sdk.dir and MAPS_API_KEY
./gradlew assembleDebug
```

**Windows PowerShell:** `Copy-Item local.properties.example local.properties`,
then `.\gradlew.bat assembleDebug`.

The project (Gradle Kotlin DSL, version catalog, Hilt, Compose, Navigation,
Room, DataStore, Retrofit/OkHttp, Coil, Maps Compose, FCM) is fully written
and reviewed, but **could not be compiled in the environment this was built
in**, because that sandbox's network policy blocks `dl.google.com` (which
`google()`/`maven.google.com` redirects to for the Android Gradle Plugin and
SDK components) — see `docs/build-status.md` for details. Build it on a
machine with normal internet access and an installed Android SDK.

## Firebase setup

The Android app ships with the Firebase BOM, Cloud Messaging, Analytics and
the `google-services` Gradle plugin already wired into
`android/BusGoAndroid/build.gradle.kts` / `app/build.gradle.kts`. The admin
panel (`admin/`) is a static Vite build, so it deploys as-is to Firebase
Hosting via the `firebase.json` / `.firebaserc` at the repo root (project
`redbus-cb9c3`).

To finish wiring an existing Firebase project (`login` first — use
`--no-localhost` on a remote/headless machine):

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use redbus-cb9c3

# Register the Android app (skip if it already exists — check with `apps:list`)
npx -y firebase-tools@latest apps:create ANDROID 'BusGo' \
  --package-name com.busgo.app --project redbus-cb9c3

# Fetch its config and save it where the Gradle plugin expects it
npx -y firebase-tools@latest apps:sdkconfig ANDROID <APP_ID> --project redbus-cb9c3 \
  > android/BusGoAndroid/app/google-services.json

# Build the admin panel and deploy it to Firebase Hosting
cd admin && npm install && npm run build && cd ..
npx -y firebase-tools@latest deploy --only hosting --project redbus-cb9c3
```

`android/BusGoAndroid/app/google-services.json` is git-ignored (see
`google-services.json.example` for the shape) — never commit the real file's
API key/app ID pair to source control the same way `local.properties` is kept
out of git.

## Database

Schema: `backend/prisma/schema.prisma`. It covers identity/RBAC, operators,
geography, routes/buses/seat layouts, trips/seat inventory/seat locks,
bookings/passengers/payments/refunds, coupons/promotions/referrals,
reviews/notifications/support, and system tables (audit log, settings) — see
[`docs/database.md`](docs/database.md).

```bash
cd backend
npx prisma migrate dev --name <description>   # new migration
npx prisma db seed                             # re-seed
```

## Documentation

- [`docs/build-status.md`](docs/build-status.md) — what's implemented vs. scaffolded, by phase
- [`docs/architecture.md`](docs/architecture.md) — system architecture
- [`docs/database.md`](docs/database.md) — schema walkthrough
- [`docs/security.md`](docs/security.md) — security posture and rules enforced

## Security notes

- Prices, seat availability, discounts, taxes and payment status are always
  computed/verified server-side — the backend never trusts these values from
  a client.
- Mock mode (`MOCK_PAYMENTS`, `MOCK_OTP`, `MOCK_EMAIL`, `MOCK_WHATSAPP`) is
  hard-blocked in production (`backend/src/config/env.ts` throws on boot).
- Secrets live only in `.env` (backend) — never in the Android app or admin
  bundle. The Android app only ever holds a domain/app-restricted Google Maps
  key.
