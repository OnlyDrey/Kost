# Docker Guide

This guide covers how Kost is built, run, and packaged with Docker.

## Container Model

Kost uses two services defined in `docker-compose.yml`:

- `db`: PostgreSQL 16
- `app`: single container that serves both backend API and built frontend assets

Default app access:

- App: <http://localhost:3000>
- Health: <http://localhost:3000/api/health>

## Build the Docker Image

Build directly with Docker:

```bash
docker build -t kost .
```

Or use project helper scripts:

```bash
npm run docker:image:build
```

Advanced build variants:

```bash
npm run docker:image:build:mirror
npm run docker:image:build:ci
```

## Run with Docker Compose

Start services:

```bash
docker compose up -d
```

Stop services:

```bash
docker compose down
```

Rebuild and restart:

```bash
docker compose up -d --build
```

Update running containers after image changes:

```bash
docker compose pull
docker compose up -d
```

## Environment Variables

Core values are configured through `.env` (see `.env.example`).

Important variables:

- `APP_PORT`: published app port (default `3000`)
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`: PostgreSQL credentials/database
- `JWT_SECRET`: required secret for auth tokens
- `APP_URL`, `CORS_ORIGIN`: app/API origin settings
- `COOKIE_SECURE`: set to `true` behind HTTPS
- `BOOTSTRAP_ADMIN_*`: default admin bootstrap values

## Volumes and Persistence

The compose setup defines persistent volumes:

- `postgres_data`: PostgreSQL data directory
- `uploads_data`: uploaded files used by the API

These volumes preserve data across container restarts/redeployments.

## Local Packaging Workflow

Typical maintainer workflow:

1. Build/test locally
2. Build image (`docker build -t kost .`)
3. Run with compose (`docker compose up -d`)
4. Validate health endpoint and app login

## Publishing an Image (Maintainers)

Example flow (replace registry and tag values):

```bash
docker build -t registry.example.com/kost/kost:latest .
docker push registry.example.com/kost/kost:latest
```

Consumers can then use that image in `docker-compose.yml` instead of local build.
