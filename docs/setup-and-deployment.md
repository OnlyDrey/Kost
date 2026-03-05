# Setup and Deployment

## What you need

- Docker Engine + Docker Compose v2 (`docker compose`)
- Optional for non-Docker development: Node.js 20+, npm 10+, PostgreSQL 16+

## What you get

- Fast Docker-first setup path.
- Clear environment variable contract.
- Production deployment baseline with HTTPS and proxy guidance.

## Docker quick start

```bash
git clone https://github.com/OnlyDrey/Kost.git
cd Kost
cp .env.example .env
```

Set at least:

- `JWT_SECRET`
- `BOOTSTRAP_ADMIN_PASSWORD`

Start:

```bash
docker compose up --build
```

Open:

- App: <http://localhost:3000>
- Health: <http://localhost:3000/api/health>
- API docs: <http://localhost:3000/api/docs>

## Environment variables

### Mandatory before real use

| Variable | Why it matters |
| --- | --- |
| `JWT_SECRET` | Signs auth tokens; must be unique and secret |
| `BOOTSTRAP_ADMIN_PASSWORD` | Initial admin credential on startup |

### Runtime and networking

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_PORT` | `3000` | Host port mapped to app container |
| `APP_URL` | `http://localhost:3000` | External app URL used by backend |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed browser origin(s) |
| `TRUST_PROXY` | `1` | Proxy hop trust for secure-request detection |
| `COOKIE_SECURE` | `false` | Must be `true` behind HTTPS |

### Database and auth

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_USER` | `kostuser` | Postgres username |
| `DB_PASSWORD` | `kostpass` | Postgres password |
| `DB_NAME` | `kost` | Postgres database name |
| `DATABASE_URL` | local value in `.env.example` | Local/non-container API database DSN |
| `JWT_EXPIRES_IN` | `7d` | Token expiry window |

### Behavior flags

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_ENABLE_PWA` | `false` | Enable service worker in production build |
| `VITE_DEBUG_MODE` | `false` | Runtime diagnostics overlay/marker |
| `HEALTH_REQUIRE_WEB_ASSETS` | `true` | Health endpoint requires built frontend assets |
| `BOOTSTRAP_ADMIN_ON_STARTUP` | `true` | Auto-create bootstrap admin |
| `RATE_LIMIT_TTL` | `60` | Rate-limit window in seconds |
| `RATE_LIMIT_MAX` | `10` | Max requests within window |

## Local development (without Docker)

1. Install dependencies:

```bash
npm install
```

Optional system check (does not run automatically unless opted in):

```bash
npm run doctor
```

To run the same check automatically during install, opt in explicitly:

```bash
RUN_SYSTEM_CHECKS=1 npm install --workspaces --include-workspace-root
```

2. Ensure PostgreSQL is running and `.env` points to it.
3. Prepare API database:

```bash
npm run db:push --workspace=apps/api
npm run seed --workspace=apps/api
```

Development policy: Prisma migration files are not committed in this repo at the current product stage. Use `db push` + `generate` instead of tracked migrations.

4. Run API and web in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

If your web dev server is not same-origin with API, set `VITE_API_URL` accordingly.

## Production deployment

- Use a reverse proxy terminating HTTPS in front of the app container.
- Set:
  - `NODE_ENV=production`
  - `APP_URL=https://your-domain`
  - `CORS_ORIGIN=https://your-domain`
  - `COOKIE_SECURE=true`
  - `VITE_DEBUG_MODE=false`

### Reverse proxy requirements

Forward at least:

- `Host`
- `X-Forwarded-Proto`
- `X-Real-IP` (recommended)

### Security behavior (runtime)

- HSTS is emitted only for secure requests in production.
- CSP mode is request-aware (`X-Kost-CSP-Mode` response header):
  - `http` mode excludes `upgrade-insecure-requests`
  - `https` mode includes `upgrade-insecure-requests`

### Verify headers

```bash
curl -sI http://localhost:3000/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
curl -sI https://your-domain/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
```

## Docker build reliability in restricted networks

If you see `TLS handshake timeout` when pulling `node:22-alpine` from Docker Hub, it is usually a network or registry-access issue on the build host (not an application code issue).

### Recommended options

1. **Use a Docker registry mirror (preferred)** on the Docker daemon.
2. **Use an internal registry** that mirrors Node base images.
3. **Pre-pull base images** on runners/build hosts before the build step.

### Standard build commands

Run from repository root:

```bash
npm run docker:image:build
npm run docker:image:help
```

Mirror/internal registry build:

```bash
NODE_IMAGE=<your-registry>/library/node:22-alpine npm run docker:image:build:mirror
```

BuildKit local cache build (CI-like local run):

```bash
NODE_IMAGE=node:22-alpine IMAGE_TAG=kost-app:ci npm run docker:image:build:ci
```

### Optional reproducibility pinning

You can pin the base image by digest for deterministic rebuilds:

```bash
NODE_IMAGE=node@sha256:<digest> npm run docker:image:build:mirror
```

Update the digest intentionally (for example when adopting Node security updates), then rebuild and validate.

### CI suggestion

For self-hosted or restricted CI runners, configure a registry mirror or pre-pull `node:22-alpine` (or your mirrored equivalent). The CI workflow also supports overriding `NODE_IMAGE` through repository variable `NODE_IMAGE`.

## CI performance and caching playbook

Current CI caches and where they apply:

- **npm cache** via `actions/setup-node` (`cache: npm`) in `build` and `test` jobs.
- **TypeScript incremental cache** (`apps/*/.cache/tsbuildinfo`, `packages/*/.cache/tsbuildinfo`) restored before typecheck/build steps.
- **Prisma engine cache** (`~/.cache/prisma`, `.prisma` directories) restored before Prisma generate/push in the `test` job.
- **Docker Buildx cache** (`cache-from/cache-to: type=gha`) in the `docker` job.

Cache invalidation triggers:

- npm cache: lockfile changes (`package-lock.json`) and dependency graph changes.
- TS incremental cache: `tsconfig` changes, lockfile changes, and web Vite config changes.
- Prisma cache: Prisma schema/package/lockfile changes.
- Docker cache: Dockerfile/context layer changes.

How to diagnose slow CI runs:

1. Check cache hit/miss lines for npm, TS cache, and Prisma cache.
2. Compare `docker` job metrics output:
   - `Docker build duration (s)`
   - `Docker image size (bytes)`
   - top layers from `docker history`
3. If web build remains heavy, compare chunk warnings and bundle outputs over time.

Local profiling quick checks:

```bash
npm run build:analyze --workspace=apps/web
npm run typecheck --workspace=apps/web && npm run typecheck --workspace=apps/web
npm run build --workspace=packages/shared && npm run build --workspace=packages/shared
```

Restricted network notes:

- Docker Hub pull TLS/timeouts are usually host/network related; prefer registry mirrors.
- Prisma engine checksum/download failures (for example `403`) are environment/network issues; keep Prisma checks enabled and use CI caches/mirrors where possible.
