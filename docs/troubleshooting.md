# Troubleshooting

## Quick checks

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f db
```

## Blank screen on `http://<host>:3000`

### Symptoms

- HTML/CSS/JS respond with `200 OK`
- UI is blank or stale

### Common causes

1. Cached service worker/assets from older builds
2. Browser HSTS/site cache mismatch for local HTTP
3. CSP upgrades requests to HTTPS while local TLS is unavailable

### Fix checklist

1. Hard-refresh browser and clear site data for the host.
2. Confirm local HTTP headers:

```bash
curl -sI http://localhost:3000/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
```

Expected locally:

- no `Strict-Transport-Security`
- `x-kost-csp-mode: http`
- CSP without `upgrade-insecure-requests`

## App cannot connect to API

- Check `APP_URL` and `CORS_ORIGIN` in `.env`.
- In local non-Docker web development, set `VITE_API_URL` correctly (for example `http://localhost:3000/api`).
- Rebuild if any `VITE_*` value changed:

```bash
docker compose up --build
```

## Diagnostics mode

Diagnostics overlay/banner/execution marker are OFF by default.

```env
VITE_DEBUG_MODE=true
```

Rebuild after toggling and disable again after root-cause analysis.

## Docker cleanup (optional)

> ⚠️ These commands can remove cached layers/images. Use only when needed.

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

### Deeper cleanup (destructive)

> ⚠️ `--volumes` can remove local Postgres data for this project.

```bash
docker system prune
docker system prune --volumes
```

## Prisma engine download blocked

If network policy blocks Prisma checksum fetch:

```bash
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```
