<p align="center">
  <img src="apps/web/public/logo-mark.svg" alt="Kost logo" width="96" />
</p>
<h1 align="center">Kost</h1>

<p align="center">Self-hosted shared expense tracking for households.</p>

## Features

- ✅ Shared expense tracking with clear user allocation
- 👨‍👩‍👧‍👦 Family-oriented accounts and roles
- 🧾 Invoice and payment workflows
- 📅 Period-based overview of costs and balances
- 🔒 Authentication with security-focused defaults
- 📊 Audit-ready data and operational visibility

## Getting started

### Prerequisites

- Docker Engine + Docker Compose v2 (`docker compose`)
- Optional (local dev mode): Node.js 20+ and npm 10+

### Quickstart (Docker)

```bash
git clone https://github.com/OnlyDrey/Kost.git
cd Kost
cp .env.example .env
# edit .env and set at least JWT_SECRET + admin credentials
docker compose up --build
```

### Required environment variables

Kost ships with sensible defaults for local development in `.env.example`.

**Mandatory to set (recommended before first run):**

- `JWT_SECRET`: signing key for auth tokens. Use a long random secret.
- `BOOTSTRAP_ADMIN_PASSWORD`: default admin password created on startup.

**Commonly changed (optional, defaults provided):**

- `APP_PORT` (default `3000`): host port exposed by Docker.
- `DB_USER` / `DB_PASSWORD` / `DB_NAME`: Postgres credentials + database name.
- `APP_URL` (default `http://localhost:3000`): external app URL used by backend.
- `CORS_ORIGIN` (default `http://localhost:3000`): allowed browser origin(s).
- `VITE_ENABLE_PWA` (default `false`): enable PWA service worker in production builds.
- `VITE_DEBUG_MODE` (default `false`): show runtime diagnostics overlay/markers.

Full variable reference: [`docs/setup.md`](docs/setup.md).

### URLs after startup

- Web app: <http://localhost:3000>
- API health: <http://localhost:3000/api/health>
- API docs (Swagger): <http://localhost:3000/api/docs>

## Configuration

- **Change host port:** set `APP_PORT` in `.env` (for example `APP_PORT=8080`).
- **Change app/base URL:** set `APP_URL` and align `CORS_ORIGIN` with your browser origin.
- **Set frontend API URL (local non-Docker web dev):** use `VITE_API_URL` (default `/api`).
- **Debug mode:** keep `VITE_DEBUG_MODE=false` by default; enable temporarily for troubleshooting.

## Advanced

- **Local development without Docker:** see [`docs/setup.md`](docs/setup.md#local-development-without-docker).
- **Database migrations/seeding:** see [`docs/setup.md`](docs/setup.md#database-migrations-and-seeding).
- **Reverse proxy / HTTPS for production:** see [`docs/deployment.md`](docs/deployment.md).

## Troubleshooting

See [`docs/troubleshooting.md`](docs/troubleshooting.md) for common issues and recovery steps.

Optional Docker cleanup commands (can remove local caches/data):

```bash
# remove stopped containers, dangling images, and unused networks
docker system prune

# remove volumes too (destructive: may delete local DB data)
docker system prune --volumes
```

## Documentation

- [Docs overview](docs/index.md)
- [Setup](docs/setup.md)
- [Deployment](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Operations](docs/operations.md)
- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [Security](docs/security.md)
