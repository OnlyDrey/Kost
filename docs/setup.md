# Setup

Use this guide for both Docker-first setup and local development.

## Prerequisites

### Docker mode (recommended)

- Docker Engine
- Docker Compose v2 (`docker compose`)

### Local development mode (optional)

- Node.js 20+
- npm 10+
- PostgreSQL 16+ (or compatible)

## Quickstart with Docker

```bash
git clone https://github.com/OnlyDrey/Kost.git
cd Kost
cp .env.example .env
```

Update at least these values before first run:

- `JWT_SECRET`
- `BOOTSTRAP_ADMIN_PASSWORD`

Start:

```bash
docker compose up --build
```

Open:

- Web: <http://localhost:3000>
- API health: <http://localhost:3000/api/health>
- API docs: <http://localhost:3000/api/docs>

## Environment variables

Values come from `.env` and are consumed by `docker-compose.yml` and app config.

### Mandatory (practical minimum)

- `JWT_SECRET`: JWT signing key. Must be changed from default example value.
- `BOOTSTRAP_ADMIN_PASSWORD`: startup admin password. Change from default.

### Optional (defaults available)

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` (example) / `production` (compose fallback) | Runtime mode |
| `TRUST_PROXY` | `1` | Reverse proxy trust setting |
| `DB_USER` | `kostuser` | Postgres username |
| `DB_PASSWORD` | `kostpass` | Postgres password |
| `DB_NAME` | `kost` | Postgres database |
| `DATABASE_URL` | local URL in `.env.example` | Used in non-container/local runs |
| `APP_PORT` | `3000` | Host port mapped to container |
| `APP_URL` | `http://localhost:3000` | External app URL |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed client origin(s), comma-separated |
| `CORS_ALLOW_PRIVATE_NETWORK` | `true` | Add private-network CORS header |
| `COOKIE_SECURE` | `false` | Set `true` when serving behind HTTPS |
| `HEALTH_REQUIRE_WEB_ASSETS` | `true` | Health check requires built web assets |
| `RATE_LIMIT_TTL` | `60` | Rate-limit window in seconds |
| `RATE_LIMIT_MAX` | `10` (`.env.example`) | Max requests per window |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `VITE_API_URL` | `/api` | API base path for local non-container web dev |
| `VITE_ENABLE_PWA` | `false` | Enable service worker/PWA |
| `VITE_DEBUG_MODE` | `false` | Runtime diagnostics overlay |
| `BOOTSTRAP_ADMIN_ON_STARTUP` | `true` | Auto-create bootstrap admin |
| `BOOTSTRAP_ADMIN_USERNAME` | `admin` | Bootstrap admin login |
| `BOOTSTRAP_ADMIN_NAME` | `Admin` | Bootstrap admin display name |

## Configuration examples

### Change exposed HTTP port

```env
APP_PORT=8080
APP_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:8080
```

### Enable temporary diagnostics

```env
VITE_DEBUG_MODE=true
```

Then rebuild:

```bash
docker compose up --build
```

## Local development without Docker

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL and create database credentials matching your `.env`.

3. Run Prisma migrations for API:

```bash
npm run migrate:deploy --workspace=apps/api
```

4. (Optional) Seed data:

```bash
npm run seed --workspace=apps/api
```

5. Run API and web in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

By default, web dev server runs on <http://localhost:5173> and calls API via `VITE_API_URL`.

## Database migrations and seeding

- Docker runtime:
  - `npm run db:migrate`
  - `npm run db:seed`
- Local runtime:
  - `npm run migrate:deploy --workspace=apps/api`
  - `npm run seed --workspace=apps/api`

For production, run behind an HTTPS reverse proxy. See [`docs/deployment.md`](./deployment.md).
