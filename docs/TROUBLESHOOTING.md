# Troubleshooting

## iOS Safari Blank White Screen on Refresh

**Symptom:** After a deployment, refreshing the app on iOS Safari shows a completely blank white screen. The app works normally on first visit but breaks on subsequent refreshes.

**Root Cause:** The browser's HTTP cache serves a stale `index.html` that references JavaScript chunk filenames from a previous deployment. The old chunks no longer exist (cleaned by Workbox), so the browser fails to load any JavaScript and renders nothing.

**Fix (applied in codebase):**
1. NestJS serves `index.html` with `Cache-Control: no-store, no-cache, must-revalidate` — both from `express.static` and the SPA fallback route.
2. The Workbox service worker uses `fetchOptions.cache: 'no-store'` on navigation requests to bypass the browser's HTTP cache entirely.

**If you still see the issue after deploying the fix:**
1. On the affected iOS device, go to **Settings > Safari > Advanced > Website Data**.
2. Find your app's domain and **Clear** its data (or "Clear History and Website Data").
3. Reload the app.

This is a one-time step — once the fix is deployed, the stale cache is the leftover from the pre-fix state. Future deployments will not cache `index.html`.

**How to verify the fix is working:**
```bash
# Check that index.html returns no-cache headers
curl -I https://your-app-domain.com/
# Should show: Cache-Control: no-store, no-cache, must-revalidate

# Check the service worker file exists
curl -s https://your-app-domain.com/sw.js | head -5
```

---

## Node Version Issues

**Problem:** `npm install` shows EBADENGINE warnings

**Solution:** Upgrade to Node 22 LTS:
```bash
nvm install 22
nvm use 22
node --version  # Should show v22.x.x
```

---

## Docker Compose V2 Errors

**Problem:** `ModuleNotFoundError: No module named 'distutils'` or `command not found: docker-compose`

**Cause:** The old Python-based `docker-compose` V1 (with hyphen) is broken on Python 3.12+.

**Solution:** Install Docker Compose V2 plugin:
```bash
# Verify
docker compose version  # Note: space, not hyphen

# Install if missing (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install docker-compose-plugin
```

---

## Port Already in Use

```bash
# Check what's using port 3000 or 5432
lsof -i :3000
lsof -i :5432

# Kill the process or change the port in .env (APP_PORT)
```

---

## Database Connection Failures

```bash
# Verify PostgreSQL is running
docker compose ps

# Test direct connection
docker compose exec db psql -U kostuser -d kost -c "SELECT 1"

# Check logs for migration errors
docker compose logs app | grep -i "migration\|prisma\|error"
```

---

## Build Errors

```bash
# Clean all build artifacts
rm -rf apps/*/dist packages/*/dist

# Rebuild from scratch
npm run build --workspace=@kost/shared
npm run generate --workspace=@kost/api
npm run build --workspace=@kost/api
npm run build --workspace=@kost/web
```

---

## Authentication Not Working

1. Verify `.env` has `JWT_SECRET` set (not the default placeholder).
2. Verify `COOKIE_SECURE=false` if running over HTTP locally.
3. Check browser DevTools > Application > Cookies — look for `access_token` cookie.
4. If behind a reverse proxy with HTTPS, set `COOKIE_SECURE=true`.

---

## Service Worker Issues

If the app behaves unexpectedly after a code change:

1. Open DevTools > Application > Service Workers.
2. Click "Unregister" on the active service worker.
3. Clear site data: DevTools > Application > Storage > Clear site data.
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R).

The service worker auto-updates on new deployments (`registerType: 'autoUpdate'`), but clearing manually helps during debugging.
