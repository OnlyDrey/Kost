# Migration Plan: main <- refactored (safe-first + evidence-driven)

## Purpose
Move improvements from `refactored` into `main` without regressing the web UI. The refactored branch currently presents a blank page (login/dashboard not reachable), so we will:
1) Identify the root cause of the blank screen.
2) Fix/refine refactored behavior (or selectively reintroduce into main).
3) Migrate in phases, with strict gates and rollback paths.

This plan is designed to work even if the execution environment cannot fetch both branches locally, by using PR #1 as the diff source.

---

## Definitions
- **Baseline:** `main` must remain runnable and display login + dashboard.
- **Diff source:** Prefer local `git diff origin/main..origin/refactored`. If not available, use PR #1 diff.
- **Blank screen:** Any of:
  - `index.html` not served correctly
  - JS chunks not loading (404/blocked)
  - runtime crash during bootstrap
  - auth/route loop preventing rendering
  - stale service worker caching invalid assets

---

## Hard Rules
1. No wholesale merge of `refactored` into `main`.
2. No dependency upgrades “just because”.
3. All changes must be staged and validated.
4. Every hypothesis must be backed by evidence (diff hunk or runtime capture).
5. If uncertain, treat as high risk and defer.

---

## Tooling & Access Strategy (important)
### Preferred: local refs
In the workspace where changes will be made:
- `git fetch --all --prune`
- verify:
  - `git rev-parse origin/main origin/refactored`

### If local refs are missing / snapshot checkout
Use PR #1 as canonical diff:
- PR URL: `https://github.com/OnlyDrey/Kost/pull/1`
- Retrieve diff via **GitHub CLI** (preferred in CI-like environments):
  - `gh pr diff 1 --repo OnlyDrey/Kost`
  - `gh pr view 1 --repo OnlyDrey/Kost --json files`
- Or via `git fetch` if possible:
  - `git fetch origin refactored:refactored`
  - `git diff main..refactored`

---

## Phase 0: Baseline capture (main)
### Goal
Create a “known-good” evidence pack for comparison.

### Actions
1. Run `main` in the most production-like way you have (docker-compose preferred).
2. Capture and save:
   - browser console (first 50 lines)
   - network summary (index.html + main JS chunk status codes)
   - server logs around initial page load
3. Write to:
   - `docs/migration/baseline-main.md`

### Gate
- `/login` renders.
- auth flow works to reach dashboard.
- hard reload on `/dashboard` works (SPA fallback OK).

---

## Phase 1: Evidence-based RCA (refactored) – NO code changes
### Goal
Find the exact failure mode causing blank screen.

### Actions
1. Run `refactored` (same method as baseline if possible).
2. Capture and save:
   - console: first error + full stacktrace
   - network: status for document + all JS/CSS chunks
   - server logs for `/`, `/login`, `/dashboard`, chunk URLs
3. Write to:
   - `docs/migration/runtime-refactored-capture.md`

### Decision tree (must classify one)
A) **Document missing or wrong**  
- index.html 404/500 or wrong content-type  
Likely hosting/static config issue.

B) **Chunks 404 / wrong paths**  
- index loads but JS chunk requests fail  
Likely Vite/Next base path, publicPath, reverse proxy, or build output path mismatch.

C) **Chunks load, then crash**  
- runtime JS error in console  
Likely bootstrap/auth/env/config error.

D) **No crash but no UI**  
- redirect loop / route guard deadlock  
Likely auth guard logic.

E) **Only fails in normal window, works in private**  
- service worker / cache issue.

---

## Phase 2: Static diff analysis (PR #1 or local diff) – NO code changes
### Goal
Create a shortlist of the top suspect changes that could produce the observed failure mode.

### Actions
1. Generate file list of changes:
   - local: `git diff --name-status origin/main..origin/refactored`
   - PR: `gh pr view 1 --repo OnlyDrey/Kost --json files`
2. Build a “boot chain map” for web:
   - entry file → root render → providers → router → auth init → api client → env config → SW
3. Produce a ranked suspect list:
   - Top 10 files with reason + diff hunk references
4. Write to:
   - `docs/migration/blank-screen-rca.md`

### Gate
- At least 1–3 “high probability” suspects identified that match the observed runtime failure mode.

---

## Phase 3: Minimal fix on refactored (or compatibility shim) – 1–3 files
### Goal
Remove blank screen with the smallest viable change.

### Rules
- Max scope: 1–3 files per attempt.
- Must include rollback plan.
- Must include validation steps.
- No refactor “cleanups” mixed into fix.

### Output
- `docs/migration/fix-1-description.md` documenting:
  - what changed
  - why it fixes the failure mode
  - how validated

### Gate
- `refactored` loads login and dashboard.
- deep link refresh works.
- console is clean of fatal errors.

---

## Phase 4: Controlled migration into main (phased)
Now that the refactor is not blank, migrate into main with strict sequencing.

### 4.1 Establish migration branches
- `chore/migrate-refactor-safe` (from main)
- `feat/web-refactor-reintro` (from main)

### 4.2 Migration order (recommended)
1) API changes that are required by the web fix (small chunks)
2) Web changes in controlled stages:
   - Stage 1: non-routing UI components
   - Stage 2: API client layer
   - Stage 3: auth/session init
   - Stage 4: routing + guards
   - Stage 5: build/hosting config

### 4.3 Gates (must pass after each stage)
- Build succeeds.
- `/login` renders.
- `/dashboard` renders after auth.
- hard reload on `/dashboard` works.
- no chunk 404s.
- no fatal console errors.

### 4.4 Documentation
Maintain:
- `docs/migration/migration-log.md` with each stage, commit refs, and validations.

---

## Definition of Done
- main branch contains migrated refactor improvements (staged).
- web is stable:
  - login + dashboard render reliably
  - deep-link reload works
  - no blank page regressions
- root cause and fix are documented in `docs/migration/blank-screen-rca.md`.