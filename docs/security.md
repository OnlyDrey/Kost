# Security headers and proxy behavior

## Trust proxy

API uses `TRUST_PROXY` (default `1`) so `req.secure` reflects HTTPS when behind a reverse proxy forwarding `X-Forwarded-Proto`.

## HSTS

`Strict-Transport-Security` is sent only when:

- `NODE_ENV=production`, and
- request is secure (`req.secure === true`)

This avoids forcing HTTPS during local plain HTTP development.

## CSP mode

CSP is set per request with proof header `X-Kost-CSP-Mode`:

- `http`: CSP excludes `upgrade-insecure-requests`
- `https`: CSP includes `upgrade-insecure-requests`

This prevents local IP access (`http://<ip>:3000`) from being upgraded to HTTPS unintentionally while keeping stricter behavior on secure traffic.
