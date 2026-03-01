# Deployment

## Docker Compose

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Required environment

- `NODE_ENV=production`
- `TRUST_PROXY=1` (or actual proxy hop count)
- `APP_URL=https://your-domain`
- `CORS_ORIGIN=https://your-domain`
- `COOKIE_SECURE=true`
- `VITE_DEBUG_MODE=false`

## Reverse proxy (HTTPS)

Your proxy should forward:

- `Host`
- `X-Forwarded-Proto`
- `X-Real-IP` (recommended)

Example (Nginx):

```nginx
location / {
  proxy_pass http://localhost:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Real-IP $remote_addr;
}
```

## Header behavior

- HSTS is emitted only in production secure requests.
- CSP mode is request-aware via `X-Kost-CSP-Mode`:
  - `http`: no `upgrade-insecure-requests`
  - `https`: includes `upgrade-insecure-requests`

## Verify

```bash
curl -sI http://localhost:3000/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
curl -sI https://your-domain/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
```
