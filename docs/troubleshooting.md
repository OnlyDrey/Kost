# Troubleshooting

## Blank screen on `http://<ip>:3000`

### Symptoms

- HTML/CSS/JS respond `200 OK`
- UI remains blank

### Common causes

1. Browser cached HSTS for host/IP.
2. CSP for local HTTP includes `upgrade-insecure-requests`, forcing assets to `https://<ip>:3000` where TLS is unavailable.

### Fix checklist

1. Clear HSTS/site data in browser.
2. Restart browser.
3. Verify local HTTP headers below.

```bash
curl -sI http://localhost:3000/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
```

Expected on local HTTP:
- no `Strict-Transport-Security`
- `x-kost-csp-mode: http`
- CSP without `upgrade-insecure-requests`

Production should use HTTPS domain + reverse proxy:

```bash
curl -sI https://your-domain/ | egrep -i "strict-transport-security|content-security-policy|x-kost-csp-mode"
```

## Debug diagnostics toggle

Diagnostics overlay/banner/execution marker are disabled by default.
Enable only for RCA:

```bash
VITE_DEBUG_MODE=true
```

Then rebuild web assets/container.

## Docker rebuild

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

## API build blocked by Prisma engine download

If network policy blocks Prisma checksum fetch:

```bash
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```
