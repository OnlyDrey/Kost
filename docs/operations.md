# Operations

> All command examples assume you are in `Kost/project` unless stated otherwise.

## What you need

- Access to Docker host and project `.env`.
- Ability to read container logs and run curl checks.

## What you get

- Day-2 runbook for deploy/update, diagnostics, and recovery.
- Common failure scenarios with direct fixes.

## Core operational commands

```bash
# Status
docker compose ps

# Follow logs
docker compose logs -f app
docker compose logs -f db

# Rebuild and restart
docker compose down
docker compose up --build
```

## Monitoring and diagnostics

### Health endpoints

- API health: `GET /api/health`
- App root: `GET /`

### Header diagnostics

```bash
curl -sI http://localhost:3000/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
```

### Debug mode (temporary)

Enable only during investigation:

```env
VITE_DEBUG_MODE=true
```

Then rebuild and disable after root-cause analysis.

## Common failure scenarios

### Blank or stale UI after deploy

Likely causes:

- stale service worker/browser cache
- HTTPS upgrade mismatch on local HTTP

Steps:

1. Hard-refresh and clear site data.
2. Rebuild the app image (`docker compose up --build`).
3. Validate CSP/HSTS headers with the curl command above.

### API unreachable from browser

Check:

- `APP_URL` and `CORS_ORIGIN` in `.env`
- `VITE_API_URL` in local non-container web development
- container health and logs (`docker compose ps`, `docker compose logs -f app`)

### Prisma engine checksum issues

If constrained networks block checksum fetch:

```bash
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

## Recovery and cleanup

### Standard no-cache rebuild

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

### Optional host cleanup (destructive)

> `--volumes` may remove local database data.

```bash
docker system prune
docker system prune --volumes
```

## Audit and traceability

Operationally relevant actions are captured in the API audit domain. For incident analysis:

1. Capture UTC time window.
2. Collect app and db logs.
3. Correlate user action timeline with audit events.
