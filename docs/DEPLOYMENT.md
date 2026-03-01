# Deployment

## Docker Compose (single-container app + db)

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Required environment

- `NODE_ENV=production`
- `TRUST_PROXY=1` (or the correct proxy hop count)
- `APP_URL=https://your-domain`
- `CORS_ORIGIN=https://your-domain`
- `COOKIE_SECURE=true` behind HTTPS

## Reverse proxy (HTTPS)

Your proxy must forward:

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

## Security header behavior

- HSTS is emitted only when:
  - `NODE_ENV=production`, and
  - request is secure (`req.secure === true`, based on trusted proxy headers).
- Direct local HTTP access should not emit HSTS.

## Verify headers

```bash
# Direct local HTTP (expected: no Strict-Transport-Security)
curl -sI http://localhost:3000/ | egrep -i "strict-transport-security|content-security-policy"

# Through HTTPS domain/proxy (expected in prod: Strict-Transport-Security present)
curl -sI https://your-domain/ | egrep -i "strict-transport-security|content-security-policy"
```
