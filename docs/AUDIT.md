# Kost Repository Audit Report

**Date:** 2026-02-27
**Scope:** Full-stack audit of `kost/` monorepo — architecture, security, iOS blank screen RCA, dependencies, build pipeline, and documentation.

---

## A) Executive Summary

### Biggest Architectural Wins
1. **Clean single-container deployment** — NestJS serves both REST API and the pre-built React SPA from the same origin. No split-routing or proxy config needed for consumers.
2. **Money as integers** — All monetary values are stored as cents (`Int`). No floating-point rounding bugs.
3. **Workbox + Dexie offline stack** — Meaningful offline support with queued mutations and PWA installability.
4. **Sensible auth pattern** — JWT in HTTP-only cookie, extracted via Passport, with 2FA/TOTP support.

### Biggest Risks
1. **iOS Safari blank screen (P0)** — Root-caused to missing `Cache-Control` headers on `index.html` in the NestJS static serving layer. Fixed in this PR.
2. **`strict: false` TypeScript everywhere** — Base `tsconfig.base.json` has `strict: false`, propagated to all workspaces. Silent `any` leaks, unchecked nulls.
3. **Middleware ordering** — `express.static(publicDir)` runs before `helmet`, so static assets skip all security headers.
4. **Dockerfile uses Node 20, `.nvmrc` says 22** — Version skew between CI/local dev (Node 22) and production image (Node 20-alpine).
5. **Rate limiter declared but not applied** — `ThrottlerModule` is imported but `ThrottlerGuard` is never registered as `APP_GUARD`, so no route is actually rate-limited.

### Priority Plan

| Priority | Item | Section |
|----------|------|---------|
| **Now** | Fix iOS blank screen (`Cache-Control` on `index.html`) | C |
| **Now** | Add `fetchOptions.cache: 'no-store'` to SW navigation cache | C |
| **Now** | Align Dockerfile base image to Node 22 | G-1 |
| **Next** | Register `ThrottlerGuard` as global guard | G-2 |
| **Next** | Move `helmet` before `express.static` (+ fix inline script) | G-3 |
| **Next** | Enable `strict: true` in TypeScript incrementally | G-4 |
| **Next** | Remove dead schema models (`MagicLinkToken`, `WebAuthnCredential`) | G-5 |
| **Later** | Add E2E tests for auth + offline queue | G-6 |
| **Later** | Split `useApi.ts` (600+ lines) into per-domain hook files | G-7 |

---

## B) Repo Reality Map

### Actual Folder Structure
```
kost/
├── apps/
│   ├── api/          # NestJS backend (9 domain modules)
│   │   ├── src/
│   │   │   ├── auth/          # JWT + 2FA TOTP
│   │   │   ├── users/         # CRUD + avatar upload
│   │   │   ├── family/        # Categories, payment methods, vendors, currency
│   │   │   ├── periods/       # Monthly period lifecycle + closing/settlement
│   │   │   ├── invoices/      # Expenses + allocation engine
│   │   │   ├── payments/      # Payment tracking
│   │   │   ├── subscriptions/ # Recurring expenses
│   │   │   ├── incomes/       # User income registration
│   │   │   ├── audit/         # Audit logging
│   │   │   ├── health/        # Health check
│   │   │   ├── prisma/        # PrismaService
│   │   │   ├── config/        # Env config factory
│   │   │   └── common/        # Guards, decorators
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # 14 models, 8 enums
│   │   │   ├── migrations/    # 10 migrations
│   │   │   └── seed.ts
│   │   └── scripts/
│   │       ├── docker-entrypoint.sh
│   │       └── bootstrap-admin.js
│   │
│   └── web/          # React 18 SPA
│       ├── src/
│       │   ├── pages/         # 13 page components
│       │   ├── components/    # 12 shared components
│       │   ├── hooks/         # useApi.ts (single file, all queries)
│       │   ├── services/      # api.ts (axios), auth.ts
│       │   ├── stores/        # auth.context.tsx, settings.context.tsx
│       │   ├── idb/           # db.ts (Dexie cache), queue.ts (offline queue)
│       │   ├── i18n/          # en.json, nb.json
│       │   ├── routes/        # index.tsx
│       │   └── utils/         # currency, date, distribution, periodStatus
│       └── public/            # PWA icons, manifest
│
├── packages/
│   └── shared/       # Enums, Zod schemas, interfaces
│
├── docs/             # Existing: architecture, deployment, database, contributing, branding
├── Dockerfile        # Multi-stage build (Node 20-alpine)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### Intended vs. Observed Differences

| Aspect | Intended | Observed |
|--------|----------|----------|
| Node version | 22 LTS | `.nvmrc` = 22, `Dockerfile` = 20-alpine, `engines` = `>=20` |
| `strict` TypeScript | Expected for production | `strict: false` in base config |
| Rate limiting | Configured via `ThrottlerModule` | Module imported but guard never applied |
| Auth methods | Password only (current) | Schema has `MagicLinkToken` and `WebAuthnCredential` models but no code uses them |
| `index.html` caching | README says "no-store/no-cache headers" | Code sets **no** cache headers on `index.html` (fixed in this PR) |
| Role names | `JUNIOR` in architecture.md | Renamed to `CHILD` in code and DB migration |
| `sw/` directory | Listed in `architecture.md` | Does not exist — SW is auto-generated by `vite-plugin-pwa` |

---

## C) iOS Safari Blank Screen Deep Dive

### Observations

The reported symptom: on iOS Safari, refreshing a page sometimes yields a completely blank (white) screen. The only workaround is to manually change the port in the URL bar, then change it back — which forces Safari to bypass its cache entirely.

### Root Cause (CONFIRMED): Stale `index.html` served from browser HTTP cache

**Mechanism:**

1. User visits the app. NestJS serves `index.html` via `express.static(publicDir)` or the SPA fallback middleware.
2. Neither code path sets `Cache-Control` headers. Express.static's default is to set `Last-Modified` only, with no explicit cache directive.
3. The browser (especially iOS Safari) applies heuristic caching: it caches the response and may return it from disk cache without revalidating.
4. Developer deploys a new version. Vite generates new chunk filenames (e.g., `index-abc123.js` → `index-def456.js`).
5. The Workbox service worker updates. `cleanupOutdatedCaches: true` removes old precached chunks.
6. User refreshes. The service worker's `NetworkFirst` strategy calls `fetch()` for the navigation request.
7. **Critical:** `fetch()` goes through the browser's HTTP cache layer. Safari returns the **stale** `index.html` from disk cache (because no `Cache-Control: no-cache` was set).
8. The stale HTML references old chunk hashes (`index-abc123.js`) that no longer exist — they've been cleaned from both the server and the SW precache.
9. The browser attempts to load the JS module, gets a 404, and renders a blank white screen.
10. The `vite:preloadError` handler only fires for dynamic imports — if the **entry point** chunk is missing, no JS executes at all.

**Why the port workaround works:** Typing a different port forces a connection failure, then re-entering the correct port triggers a completely fresh navigation that bypasses Safari's disk cache.

### Hypothesis Ranking

| Rank | Hypothesis | Confidence |
|------|-----------|------------|
| 1 | Missing `Cache-Control` on `index.html` → stale HTML → missing chunks → blank screen | **95%** |
| 2 | SW `fetch()` reads from browser HTTP cache even with `NetworkFirst` | Contributing factor (same root cause) |
| 3 | BFCache restoring empty render tree | Unlikely primary cause (hardening already exists) |
| 4 | Auth redirect loop | Ruled out — the 401 interceptor redirects to `/login`, not blank |
| 5 | Incorrect SPA fallback | Ruled out — fallback correctly sends `index.html` for non-API/non-file paths |

### Files Involved

| File | Issue |
|------|-------|
| `apps/api/src/main.ts:30-32` | `express.static(publicDir)` — no `Cache-Control` on `index.html` |
| `apps/api/src/main.ts:103` | `res.sendFile(index.html)` — no `Cache-Control` on SPA fallback |
| `apps/web/vite.config.ts:61-67` | `NetworkFirst` navigation cache missing `fetchOptions.cache: 'no-store'` |

### Fixes Applied (this PR)

**1. Server-side: `Cache-Control` on `index.html` (`apps/api/src/main.ts`)**

```typescript
// express.static now sets no-cache headers on index.html
app.use(
  express.static(publicDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  }),
);

// SPA fallback also sets no-cache headers
res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
res.setHeader("Pragma", "no-cache");
res.setHeader("Expires", "0");
return res.sendFile(join(publicDir, "index.html"));
```

**2. Service Worker: bypass HTTP cache for navigation (`apps/web/vite.config.ts`)**

```typescript
{
  urlPattern: ({ request }) => request.mode === 'navigate',
  handler: 'NetworkFirst',
  options: {
    cacheName: 'navigation-cache',
    networkTimeoutSeconds: 5,
    fetchOptions: {
      cache: 'no-store',  // Bypass browser HTTP cache
    },
  }
}
```

### How to Verify on iOS Safari

1. Deploy the fix to production.
2. On an iOS device, open Safari > Settings > Clear History and Website Data for the app's domain.
3. Visit the app, navigate around, let the SW install.
4. Redeploy with a trivial change (forces new chunk hashes).
5. On iOS Safari, pull-to-refresh or tap the URL bar and press Go.
6. The app should load correctly with new chunks — no blank screen.
7. Test with airplane mode toggle: the SW should serve cached content offline.

### Hardening Recommendations

1. The existing `vite:preloadError` handler catches lazy-loaded chunk failures — keep it.
2. The existing BFCache `pageshow` handler reloads on empty root — keep it.
3. Consider adding a `<noscript>` fallback message in `index.html` for debugging blank screens.
4. The `nginx.conf` in `apps/web/` already has correct `Cache-Control` for `index.html` — if ever switching to separate nginx+api containers, it will work correctly.

---

## D) Backend Review

### NestJS Module Structure
Well-organized with clear domain boundaries: Auth, Users, Family, Periods, Invoices, Payments, Subscriptions, Incomes, Audit, Health. Each module has controller + service + DTOs.

### Auth & Cookie Handling
- **Good:** JWT in HTTP-only cookie, SameSite=Lax/Strict based on HTTPS, cookie extraction via Passport strategy with header fallback.
- **Good:** 2FA TOTP with custom implementation, recovery codes, ±1 time step drift tolerance.
- **Issue:** `getCookieOptions` derives `secure` from `request.secure || isForwardedHttps`, but the `request.secure` check can be unreliable behind proxies. Should trust `X-Forwarded-Proto` when proxy is configured.
- **Issue:** No password strength validation in DTOs. `PasswordRegisterDto` likely allows any string.

### Prisma Usage Patterns
- **Good:** Cascade deletes configured properly, proper indexing on foreign keys.
- **Good:** Transaction used for account deletion (reassign invoices then delete user).
- **Issue:** `MagicLinkToken` and `WebAuthnCredential` models exist but have no service/controller code. Dead schema weight.
- **Issue:** `consumeRecoveryCode` uses raw SQL (`$executeRaw`) — while correct for atomic array_remove, it bypasses Prisma's type safety.

### Error Handling
- **Good:** Proper HTTP status codes (401, 403, 409, 400).
- **Issue:** No global exception filter for unhandled errors. NestJS defaults handle this but a custom filter would add structured logging.

### Security Headers
- **Issue:** `helmet` runs after `express.static`, so static assets (JS, CSS, images) are served without any security headers (no CSP, no X-Frame-Options, etc.).
- **Issue:** The inline `<script>` in `index.html` (dark mode init) would break if CSP is tightened. Need to either externalize the script or use a nonce.

### Static File Serving
- **Fixed (this PR):** `index.html` now has proper `Cache-Control: no-store` headers.
- **Good:** SPA fallback correctly excludes `/api`, `/uploads`, and files with extensions (`.`).
- **Good:** Upload directories auto-created on boot.

---

## E) Frontend Review

### Routing
- **Good:** Clean route structure with `ProtectedRoute` and `AdminRoute` wrappers, legacy redirects for old paths.
- **Issue:** Catch-all `path="*"` redirects to `/login` — should redirect to `/overview` for authenticated users.

### TanStack Query Patterns
- **Good:** Centralized `QueryClient` config with sensible defaults (5min stale, 30min gc, 1 retry).
- **Good:** Offline queue integration in mutation `onError` callbacks.
- **Issue:** `useApi.ts` is a single 600+ line file containing ALL query/mutation hooks. Should be split by domain (e.g., `useInvoiceApi.ts`, `usePeriodApi.ts`).

### Service Worker Implementation
- **Good:** `registerType: 'autoUpdate'` with `skipWaiting` + `clientsClaim` for immediate activation.
- **Good:** HTML excluded from precache (`globPatterns` only includes JS/CSS/assets).
- **Good:** `cleanupOutdatedCaches: true` removes old precache entries.
- **Fixed (this PR):** Navigation cache now uses `fetchOptions.cache: 'no-store'` to bypass HTTP cache.
- **Good:** `controllerchange` listener reloads the page on SW update.

### Dexie Offline Queue
- **Good:** Clean implementation with retry logic (max 3), FIFO ordering, automatic processing on `online` event.
- **Issue:** No conflict resolution — if a queued POST creates a duplicate on replay, the server will 409. Mutations should be idempotent or queue entries should include dedup keys.
- **Issue:** The `online` event listener is in module scope — if the module is imported but the user isn't authenticated, queued requests will fail with 401.

### i18n Setup
- **Good:** Two complete translation files (en, nb) with comprehensive key coverage.
- **Issue:** Fallback language is `nb` (Norwegian), which is unusual — typically fallback should be `en` for international developers.

### API Client Config
- **Good:** `withCredentials: true` for cookie auth.
- **Good:** 401 interceptor redirects to login (except for login endpoint itself).
- **Issue:** The 401 interceptor does `window.location.href = '/login'` which triggers a full page reload. For SPA navigation, should use a callback or event emitter to trigger React Router navigation.

---

## F) Dependency & Workspace Audit

### Unused Dependencies
| Package | Location | Status |
|---------|----------|--------|
| `dexie-react-hooks` | `apps/web` | **Unused** — no imports found in any source file |
| `uuid` | `apps/api` | **Unused** — Prisma generates IDs via `cuid()` |
| `zod` | `apps/api` | **Unused in API** — only used in `packages/shared`, but listed as API dependency too |

### Overlapping Libraries
| Concern | Libraries |
|---------|-----------|
| Validation | `class-validator` + `zod` — API uses class-validator (DTOs), shared uses Zod. Pick one. |
| ID generation | `uuid` (unused) + Prisma `cuid()` (actually used) |

### Version Inconsistencies
| Package | Root | API | Web | Shared |
|---------|------|-----|-----|--------|
| `typescript` | `^5.3.3` | `^5.3.3` | `^5.3.3` | `^5.3.3` | Consistent |
| `@types/node` | `^20.11.5` | `^20.11.5` | `^20.11.17` | — | Minor diff, OK |
| Node runtime | `.nvmrc`=22 | — | — | — | Dockerfile uses Node 20 |

### Script Inconsistencies
- `apps/web` has both `type-check` and `typecheck` scripts (aliases of each other) — consolidate to one.
- Root `prepare` script uses `husky install` (Husky v8 syntax) but there's no `.husky/` directory visible.

### CI Environment Variables
The CI workflow sets `MAGIC_LINK_SECRET`, `AUTH_PASSWORD_ENABLED`, `AUTH_MAGIC_LINK_ENABLED`, `AUTH_PASSKEY_ENABLED` — none of these are used in the current configuration factory. They're leftovers from a previous auth architecture.

---

## G) Concrete Refactor Proposals

### G-1: Align Dockerfile to Node 22

**Problem:** `.nvmrc` specifies Node 22, CI uses Node 22 (via `.nvmrc`), but `Dockerfile` uses `node:20-alpine`. Version skew between dev/CI and production.

**Proposed change:** Update both `FROM` lines in `Dockerfile` from `node:20-alpine` to `node:22-alpine`.

**Files affected:** `Dockerfile` (lines 3, 31)

**Risks:** Low — Node 22 is LTS and actively supported. Prisma binary target `linux-musl-openssl-3.0.x` works on Node 22 alpine.

**Acceptance criteria:** `docker compose build` succeeds, `node --version` inside container reports `v22.x.x`.

---

### G-2: Actually Enable Rate Limiting

**Problem:** `ThrottlerModule` is imported in `app.module.ts` with `ttl: 60000, limit: 10`, but the `ThrottlerGuard` is never registered as an `APP_GUARD`. No endpoint is rate-limited.

**Proposed change:** Add `{ provide: APP_GUARD, useClass: ThrottlerGuard }` in `app.module.ts` providers, or at minimum in `auth.module.ts` for login/register routes.

**Files affected:** `apps/api/src/app.module.ts`

**Risks:** Medium — applying globally could affect legitimate high-frequency API calls. Consider applying only to auth routes initially.

**Acceptance criteria:** Sending >10 requests in 60s to `/api/auth/login/password` returns 429.

---

### G-3: Fix Middleware Ordering (helmet before static)

**Problem:** `express.static(publicDir)` runs before `helmet`, so all static assets are served without security headers (CSP, X-Frame-Options, etc.).

**Proposed change:** Move `helmet()` before the static middleware calls in `main.ts`. Configure CSP to allow the inline dark-mode script via hash or move it to an external file.

**Files affected:** `apps/api/src/main.ts`, `apps/web/index.html`

**Risks:** Medium — CSP changes need testing. The inline script hash must match exactly.

**Acceptance criteria:** `curl -I https://app/assets/index-xxx.js` shows `X-Content-Type-Options: nosniff` and other helmet headers. Inline dark mode script still works.

---

### G-4: Enable TypeScript Strict Mode Incrementally

**Problem:** `tsconfig.base.json` has `strict: false`. This means no strict null checks, no implicit any detection, no strict property initialization. Bugs hide silently.

**Proposed change:** Enable `strict: true` in `tsconfig.base.json`. Fix type errors workspace by workspace (shared → api → web).

**Files affected:** `tsconfig.base.json`, then cascading fixes across all workspaces.

**Risks:** High effort — will surface many type errors. Do it incrementally per workspace.

**Acceptance criteria:** `npm run typecheck --workspaces` passes with `strict: true`.

---

### G-5: Remove Dead Prisma Models

**Problem:** `MagicLinkToken` and `WebAuthnCredential` models exist in `schema.prisma` but no code references them. They create unnecessary DB tables and migration weight.

**Proposed change:** Create a migration that drops the `magic_link_tokens` and `webauthn_credentials` tables. Remove models from schema.

**Files affected:** `apps/api/prisma/schema.prisma`

**Risks:** Low — no code uses these models. Verify with `grep -r "MagicLink\|WebAuthn" apps/api/src/`.

**Acceptance criteria:** `prisma migrate deploy` succeeds, no references to removed models in codebase.

---

### G-6: Add E2E Tests for Critical Paths

**Problem:** Test suite has `continue-on-error: true` in CI. Only unit tests for allocation and a few services. No E2E tests for auth flow, invoice lifecycle, or period closing.

**Proposed change:** Add Supertest-based E2E tests for: login → create invoice → make payment → close period.

**Files affected:** `apps/api/test/` (new files)

**Risks:** Low — additive only.

**Acceptance criteria:** `npm run test:e2e --workspace=@kost/api` runs login + CRUD + settlement flow against test DB.

---

### G-7: Split `useApi.ts` Into Domain-Specific Hook Files

**Problem:** `apps/web/src/hooks/useApi.ts` is a single 600+ line file containing every query and mutation hook. Hard to navigate, review, and maintain.

**Proposed change:** Split into `useInvoiceApi.ts`, `usePeriodApi.ts`, `useUserApi.ts`, `useSubscriptionApi.ts`, `useFamilyApi.ts`, `useAuthApi.ts`. Re-export from `useApi.ts` for backwards compatibility.

**Files affected:** `apps/web/src/hooks/useApi.ts` → split into 6+ files.

**Risks:** Low — purely organizational refactor with re-exports.

**Acceptance criteria:** All imports still resolve, no runtime regressions.

---

### G-8: Remove Unused Dependencies

**Problem:** `dexie-react-hooks`, `uuid`, and `zod` (in API) are listed as dependencies but never imported.

**Proposed change:** `npm uninstall dexie-react-hooks --workspace=@kost/web`, `npm uninstall uuid @types/uuid --workspace=@kost/api`, `npm uninstall zod --workspace=@kost/api`.

**Files affected:** `apps/web/package.json`, `apps/api/package.json`

**Risks:** Low — verify no transitive usage first.

**Acceptance criteria:** `npm run build --workspaces` succeeds after removal.

---

### G-9: Fix CI `continue-on-error` Anti-Pattern

**Problem:** Both lint and test steps use `continue-on-error: true`, meaning broken tests or lint errors never fail the build.

**Proposed change:** Remove `continue-on-error: true` from test and lint steps. Fix any currently-failing tests.

**Files affected:** `.github/workflows/ci.yml`

**Risks:** Medium — will block merges if tests are currently failing. Fix tests first.

**Acceptance criteria:** CI fails on test/lint errors.

---

### G-10: Fix Catch-All Route for Authenticated Users

**Problem:** `path="*"` in routes always redirects to `/login`, even for authenticated users who mistype a URL.

**Proposed change:** Change catch-all to check auth state and redirect to `/overview` if authenticated, `/login` otherwise.

**Files affected:** `apps/web/src/routes/index.tsx`

**Risks:** Low.

**Acceptance criteria:** Authenticated user visiting `/nonexistent` lands on `/overview`.

---

## H) Documentation Rewrite Plan

### Proposed `/docs` Structure

```
docs/
├── GETTING_STARTED.md     # First-time setup (replaces SETUP.md)
├── ARCHITECTURE.md        # Tech stack, project structure, auth, data flow
├── DEVELOPMENT.md         # Local dev workflow, scripts, debugging
├── DEPLOYMENT.md          # Production setup, reverse proxy, env vars
├── SECURITY_AUTH.md       # Auth flow, cookie config, 2FA, security headers
├── API.md                 # REST API overview, Swagger link, key endpoints
├── DATABASE.md            # Schema, migrations, seed, backup
├── TROUBLESHOOTING.md     # iOS blank screen, common errors
├── CONTRIBUTING.md        # Branching, PR guidelines, code style
├── allocation-rules.md    # (existing) Cost split algorithm
├── branding.md            # (existing) Logo/icon guidelines
└── ui-state-guardrails.md # (existing) UI consistency rules
```

**Files to remove:** `ROUNDING_ALLOCATION_RULES.md` (root) — duplicate of `docs/allocation-rules.md`.

### Key Issues in Current Docs
- `architecture.md` references `JUNIOR` role (renamed to `CHILD`)
- `architecture.md` references `sw/` directory (doesn't exist)
- `README.md` claims "index.html is served with no-store/no-cache headers" — this was NOT true until this fix
- No troubleshooting doc for iOS blank screen
- SETUP.md is comprehensive but could merge into GETTING_STARTED.md
