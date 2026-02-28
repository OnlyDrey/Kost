# Minimal Fix Plan (No Code Applied Yet)

Scope: only HIGH-probability hypotheses from `docs/migration/blank-screen-rca.md`, with minimal (1–3 file) interventions.

---

## HIGH-1 — CSP blocks startup script/module path

### Minimal fix attempt scope (max 1–3 files)
1. `apps/web/nginx.conf`
2. (Optional if needed) `apps/web/index.html`

### Change category
- **Header policy alignment only** (no refactor): make CSP compatible with actual startup assets/scripts.
- Preferred minimal direction:
  - keep strict default policy,
  - explicitly allow only required startup script mode (either fully externalize theme-init and remove inline startup script, or add narrowly scoped inline allowance/nonce strategy).

### Validation steps (requires runtime confirmation)
- Open app and capture:
  - browser console CSP violations,
  - response headers for `/` and `/index.html`,
  - whether React root mounts.
- Expected success signal:
  - no CSP `Refused to execute script` for startup path,
  - app renders initial route.

### Rollback steps
- Revert only `apps/web/nginx.conf` (and `apps/web/index.html` if touched).
- Redeploy/restart serving layer and retest startup.

### Stop conditions
- If blank persists **without CSP errors**, stop CSP track and collect:
  - full console stack,
  - failed network requests (if any),
  - current response headers.

### Fix Attempt 01 implemented
- Updated `apps/web/nginx.conf` with a temporary diagnostic CSP that allows inline scripts (`script-src 'self' 'unsafe-inline'`) while keeping other directives restrictive.
- Kept CSP centralized in one file to minimize blast radius and confirm whether CSP caused bootstrap failure.

### Browser validation checklist
- Reload app with DevTools open.
- Confirm no CSP violations for inline/module startup scripts.
- Confirm React app mounts (login page visible).
- Confirm Network shows `index.html` 200 and JS chunks 200 (not blocked).
- If this passes, proceed with Fix Attempt 02: remove inline script dependency and harden CSP without `unsafe-inline`.

---

## HIGH-2 — `modulePreload.polyfill = false` breaks module/chunk boot on target browser

### Minimal fix attempt scope (max 1–3 files)
1. `apps/web/vite.config.ts`

### Change category
- **Build compatibility toggle only**:
  - revert to default preload behavior (remove explicit `modulePreload.polyfill: false` or set compatible option).
- No app logic change.

### Validation steps (requires runtime confirmation)
- Capture before/after:
  - browser console bootstrap errors,
  - network panel for module/chunk request failures.
- Expected success signal:
  - no early module/chunk load errors,
  - app mounts normally.

### Rollback steps
- Revert only the preload toggle line(s) in `vite.config.ts`.
- Rebuild and compare request/error profile.

### Stop conditions
- If failures persist with same chunk/module errors, capture:
  - exact failing chunk URLs/status,
  - generated asset base paths,
  - browser/version matrix.

---

## HIGH-3 — Catch-all/auth flow causes spinner/redirect dead-end

### Minimal fix attempt scope (max 1–3 files)
1. `apps/web/src/routes/index.tsx`
2. `apps/web/src/pages/Login.tsx`
3. `apps/web/src/stores/auth.context.tsx` (only if loading-state issue remains)

### Change category
- **Routing/auth guard behavior tweak only**:
  - temporarily simplify wildcard fallback to known-safe route,
  - ensure post-login redirect points to an existing stable route,
  - ensure auth init exits loading deterministically.

### Validation steps (requires runtime confirmation)
- Capture:
  - route transitions (`/login`, wildcard target, `/overview`),
  - auth loading state timeline,
  - whether spinner persists.
- Expected success signal:
  - deterministic landing page render for both auth/unauth states,
  - no redirect loop.

### Rollback steps
- Revert only touched route/auth files.
- Retest navigation with same user state.

### Stop conditions
- If still blank with no route loop signs, collect:
  - console errors with stack traces,
  - current pathname history,
  - auth API response for `getCurrentUser` and timing.

---

## Execution guardrails
- No migrations.
- No full refactor.
- Each attempt touches **at most 1–3 files**.
- If runtime is unavailable: mark status as **Requires runtime confirmation** and gather the exact logs listed above when environment allows.
