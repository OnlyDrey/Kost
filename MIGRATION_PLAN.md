# Migration plan: main -> refactored (safe-first)

## Goal
Safely migrate improvements from `refactored` into `main` without breaking the web UI (blank screen / no login / no dashboard).  
Approach: **phase the migration** into (1) safe/infrastructure changes, (2) shared code changes with guardrails, (3) web refactor reintroduction and debugging.

## Working assumption
- `main` is the last known-good baseline (web renders login/dashboard).
- `refactored` contains desired improvements but currently results in a blank web page.
- Monorepo structure exists (`apps/*`, `packages/shared`, docker compose, etc.).

---

## Phase 0: Prepare a safe migration workspace (must-do)

### 0.1 Create branches
- Create a new branch from `main`:
  - `chore/migrate-refactor-safe`
- Keep `refactored` unchanged for reference.

### 0.2 Capture “known-good” runtime signals (from main)
Run `main` and record:
- Browser console output (copy/paste)
- Network tab:
  - `GET /` response status and content-type
  - JS bundle requests (status codes)
  - Any `index.html` caching headers
- Server logs (api + web container)
- Confirm:
  - `/login` renders
  - `/dashboard` renders after auth
  - SPA refresh works on a deep route (e.g. reload on `/dashboard`)

Store these in `docs/migration/baseline-main.md`.

### 0.3 Create a diff inventory (mechanical)
From a local clone:
- `git fetch origin`
- `git diff --name-status origin/main..origin/refactored > docs/migration/diff-inventory.txt`
- Also capture:
  - `git diff --stat origin/main..origin/refactored > docs/migration/diff-stat.txt`

Classify changed files into buckets:
1) Infra/DevEx/Docs (safe)
2) API-only changes (likely safe)
3) DB schema/migrations (medium risk)
4) Shared packages (`packages/shared`) (medium risk)
5) Web app (`apps/web`) and routing/build config (highest risk, likely the cause of blank screen)

---

## Phase 1: “Safe to migrate” changes (apply first)

**Rule:** Nothing in `apps/web` (or web build tooling that directly affects the shipped bundle) gets migrated in this phase.

### 1.1 Docs only
Cherry-pick or copy changes for:
- `README.md`, `SETUP.md`, `ROUNDING_ALLOCATION_RULES.md`, `/docs/*`

Validation:
- No runtime impact. Just ensure links/commands still match reality.

### 1.2 CI/workflows
Migrate:
- `.github/workflows/*`

Validation:
- CI passes on `main` baseline after changes.
- If Node version changes are introduced, align `.nvmrc` + CI.

### 1.3 Repo hygiene & tooling (low risk)
Migrate selectively:
- `.gitignore`, `.dockerignore`
- `Makefile` (only if it doesn’t change runtime behavior)
- `check-system.sh`

Validation:
- `npm ci` works
- lint/test scripts (if any) still run

### 1.4 Docker-compose and Dockerfile (guarded)
Migrate only if changes are clearly infra-related:
- `docker-compose.yml`
- `Dockerfile`

Guardrails:
- Do NOT change exposed ports, entrypoints, or build contexts for the web yet unless required.
- Do NOT change reverse proxy / SPA fallback behavior yet.

Validation:
- `docker compose up --build`
- App still loads login/dashboard.

### 1.5 Root package manager changes (guarded)
Migrate root-level:
- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `.npmrc`

Guardrails:
- Avoid dependency major bumps that would affect `apps/web` build output until Phase 3.
- If the refactor changes Node version, apply the Node version change but validate `main` still builds.

Validation:
- Clean install: `rm -rf node_modules && npm ci`
- Build: `npm run build` (or repo’s build script)
- Run: `npm run docker:up` (or equivalent)
- Web still renders.

---

## Phase 2: Medium-risk migrations (API + DB + shared packages)

**Rule:** Still avoid importing refactored `apps/web` UI/routing changes.  
But shared packages may be needed by API and can be migrated with tests.

### 2.1 API-only changes
If `apps/api` changed in `refactored`, migrate in small PR-sized chunks:
- prefer commit-by-commit cherry-picks
- avoid combined “big bang” merges

Validation:
- API health endpoint works (or equivalent)
- Auth endpoints respond
- `/api/docs` renders (if present)

### 2.2 Database migrations (carefully)
If schema/migrations changed:
- Apply migrations on a fresh DB
- Run seeds
- Run minimal smoke tests:
  - create user
  - login
  - create expense
  - fetch dashboard data

Guardrails:
- If migrations are large, do one migration set at a time and run `db:migrate` after each.

### 2.3 Shared package migrations (`packages/shared`)
Migrate `packages/shared` next.

Guardrails:
- Run TypeScript build for shared packages
- Run API build
- Avoid changing shared exports used by web until Phase 3 (or provide compatibility shims).

Validation:
- `npm run build` for shared + api
- start stack and verify API still works.

---

## Phase 3: Reintroduce web changes (this is where the blank screen likely lives)

### 3.1 Create a dedicated branch for web refactor
From the end of Phase 2:
- branch: `feat/web-refactor-reintro`

### 3.2 Add diagnostics BEFORE migrating web code
Add minimal tooling to identify “blank screen” causes:
- Ensure sourcemaps enabled in dev
- Add a top-level error boundary / global error logger (temporary)
- Add a startup console log at app bootstrap (temporary)
- Ensure server logs requests for:
  - `/`
  - `/login`
  - `/dashboard`
  - bundle chunks

### 3.3 Migrate web changes in this order (small steps)
Apply `apps/web` changes from `refactored` incrementally:

1) Non-routing UI components (pure presentational)
2) Shared UI components that don’t touch bootstrapping
3) API client layer changes (fetch/axios wrappers)
4) State/auth plumbing (tokens, session bootstrap)
5) Build config (Vite/Next/etc), service worker, routing, SPA fallback LAST

Validation after each step:
- app renders something (even if not fully functional)
- console has no fatal error
- bundles load (no 404s)
- login page shows

---

## Phase 4: “Broken code” review steps (DO AFTER safe code is in)

Keep these steps explicitly after the safe migration. These are the most likely sources of a completely blank page.

### 4.1 Confirm what “blank” means
In the broken refactor branch:
- Is HTML empty, or JS crashes after load?
- Check:
  - View source: is `index.html` served?
  - Network:
    - are JS/CSS chunks 404?
    - is there a redirect loop?
  - Console:
    - uncaught exception at boot?
    - hydration errors (if SSR)?
    - CSP issues?

### 4.2 SPA fallback and static hosting mismatch
Common blank-screen causes in monorepos:
- Server no longer serves `index.html` for non-file routes (`/login`, `/dashboard`)
- `express.static` path changed
- `base` / `publicPath` misconfigured (assets requested from wrong path)
- reverse proxy strips prefix or changes path

Actions:
- Verify server returns `index.html` for `/login` and `/dashboard` (status 200, correct content-type).
- Verify chunk URLs in HTML match where files are actually served.

### 4.3 Service worker / Workbox caching regressions
A stale or misconfigured service worker can serve old JS (or nothing), yielding blank UI.

Actions:
- In dev: disable SW entirely
- In prod: bump SW version + force update flow
- Confirm cache headers for `index.html` and navigation requests
- Test:
  - hard reload
  - open in private window
  - unregister service worker and reload

### 4.4 Auth bootstrap deadlock
If the app waits for session init and never resolves (no UI), you’ll see:
- infinite pending request
- silent catch swallowing error
- route guard redirect loop without rendering

Actions:
- Add explicit logging around:
  - token read
  - “me” endpoint call
  - route guard decisions
- Ensure login route is always reachable.

### 4.5 Runtime env mismatch
Blank screen can happen if the client expects env vars that are missing at runtime and crashes during config init.

Actions:
- Validate `.env.example` vs actual `.env`
- Ensure client env vars are correctly prefixed (framework-specific)
- Log resolved config at boot (temporarily).

### 4.6 Dependency/bundler breakage
If refactor bumped major versions:
- build succeeds but runtime breaks due to ESM/CJS mismatch, chunk splitting, or missing polyfills.

Actions:
- Compare lockfile diffs
- Run:
  - `npm ci`
  - `npm run build`
  - `npm run start` (prod-mode)
- Inspect generated bundle for missing chunk references.

---

## Deliverables (what Codex should produce)
1) `docs/migration/baseline-main.md` (baseline evidence)
2) `docs/migration/diff-inventory.txt` + classification notes
3) PR 1: Phase 1 safe migrations (docs/ci/infra)
4) PR 2: Phase 2 API/DB/shared migrations (with tests)
5) PR 3+: Phase 3 web reintroduction (incremental, each step validated)
6) `docs/migration/blank-screen-root-cause.md` documenting the final fix once identified

---

## Definition of done
- Web loads login and dashboard reliably (dev + docker/prod-like)
- No blank screen on:
  - fresh load
  - hard reload
  - deep route refresh
- API endpoints required by dashboard succeed
- Migrations/seed steps documented and reproducible
- Refactor improvements merged without regressions