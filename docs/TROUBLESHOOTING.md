# Troubleshooting

## Blank screen on `http://<ip>:3000`

### Symptom

- HTML/CSS/JS return `200 OK`, but UI is blank on local HTTP access.

### Common cause

Browser has cached HSTS for the host/IP and upgrades requests to HTTPS, which fails for direct local access.

### Fix

1. Clear HSTS/site data for the affected host in browser settings.
2. Restart browser and retry `http://<ip>:3000`.
3. Confirm no HSTS header is returned on direct HTTP.

### Verify headers

```bash
# Local HTTP should NOT include Strict-Transport-Security
curl -sI http://localhost:3000/ | egrep -i "strict-transport-security|content-security-policy"

# HTTPS domain behind reverse proxy SHOULD include Strict-Transport-Security in production
curl -sI https://your-domain/ | egrep -i "strict-transport-security|content-security-policy"
```

## Docker build failures

If build fails, rebuild from a clean state:

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

## API build blocked by Prisma engine download

If CI/network policy blocks Prisma binary checksums, set:

```bash
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

Then retry the build command.
