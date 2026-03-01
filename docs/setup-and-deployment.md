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

2. Ensure PostgreSQL is running and `.env` points to it.
3. Prepare API database:

```bash
npm run migrate:deploy --workspace=apps/api
npm run seed --workspace=apps/api
```

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
