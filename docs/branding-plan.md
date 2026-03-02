# Branding & Semantic Color Normalization Plan

## Goal

Introduce a controlled theming foundation and a minimal Branding section in Global Settings while reducing color variation by routing styling through semantic design tokens.

## Phase 0 — Token contract + Tailwind mapping (foundation)

### Changes

- Define semantic CSS variable contract in `apps/web/src/index.css`.
- Add curated brand presets (`indigo`, `emerald`, `violet`) that affect `primary` and focus-related tokens.
- Map Tailwind semantic color names to CSS variables in `apps/web/tailwind.config.js`.
- Wire branding application on app load via the settings store.

### Acceptance criteria

- Semantic token variables exist for: `primary/success/danger/warning/neutral`, `bg/surface/surface-elevated`, `text-primary/text-secondary/text-muted`, `border/focus`.
- Tailwind utilities compile for semantic names (e.g. `bg-primary`, `text-text-secondary`, `border-border`, `ring-focus`).
- App loads with persisted brand preset and app title without manual refresh.

### Verification

- `rg -n "--color-(primary|success|danger|warning|neutral|bg|surface|text-primary|text-secondary|text-muted|border|focus)" apps/web/src/index.css`
- `rg -n "rgb\(var\(--color-" apps/web/tailwind.config.js`
- Manual: switch primary preset in settings and verify header/actions update immediately.

### Risk / rollback

- Risk: partial migration may show mixed semantic and legacy family classes.
- Rollback: restore previous `index.css`/tailwind mapping; persisted branding keys are additive and safe.

---

## Phase 1 — Shared primitives migration

### Changes

- Migrate shared primitives first:
  - `AppButton`
  - `ConfirmDialogProvider` / dialog button semantics
  - `TagPill`
  - `ActionIconBar`
- Ensure new/updated primitive styles rely on semantic tokens only.

### Acceptance criteria

- Primitive components do not depend on direct family classes (`indigo-*`, `red-*`, `gray-*`) for core states.
- Confirm dialog semantics:
  - confirm = `primary`
  - cancel = `neutral`
  - destructive confirm = `danger`

### Verification

- `rg -n "indigo-|red-|green-|amber-|gray-|slate-" apps/web/src/components/Common apps/web/src/components/Brand apps/web/src/components/Expense`
- Visual check: buttons, chips, action icons, dialogs across light/dark.

### Risk / rollback

- Risk: un-migrated page-level classes can visually diverge from primitives.
- Rollback: revert primitive-only commit; page code remains functional.

---

## Phase 2 — Highest-color-usage page migration

### Changes

- Migrate top color-heavy pages first (from audit):
  - `Admin/FamilySettings`
  - `Periods/PeriodList`
  - `Admin/Users`
  - `Settings/Profile`
- Replace direct palette classes with semantic token classes incrementally.

### Acceptance criteria

- Target pages use semantic classes for primary statuses, text, borders, and surfaces.
- Meaning mapping is consistent:
  - primary = brand
  - success = positive
  - danger = destructive/error
  - warning = caution
  - neutral = passive/secondary

### Verification

- `rg -n "indigo-|red-|green-|amber-|gray-|slate-" apps/web/src/pages/Admin/FamilySettings.tsx apps/web/src/pages/Periods/PeriodList.tsx apps/web/src/pages/Admin/Users.tsx apps/web/src/pages/Settings/Profile.tsx`
- QA walkthrough for these pages in light/dark mode.

### Risk / rollback

- Risk: broad class churn can cause visual regressions.
- Rollback: keep commits page-scoped and revert page-by-page.

---

## Phase 3 — Cleanup & enforcement

### Changes

- Remove remaining direct family usage in migrated scopes.
- Add guardrail script for CI/local checks for new hex/direct-family additions in component code.
- Keep legacy aliases temporarily for backwards compatibility, then remove in a later cleanup PR.

### Acceptance criteria

- Guardrail script exists and is documented.
- New component-level changes use semantic tokens by default.

### Verification

- `npm run check:color-guard`
- Spot-check PR diffs for raw hex and direct palette classes.

### Risk / rollback

- Risk: strict guard too early can block non-migrated files.
- Rollback: run guardrail in advisory mode until migration coverage is sufficient.

---

## Token map (contract)

| Semantic token     | Intent                             |
| ------------------ | ---------------------------------- |
| `primary`          | Brand/main CTA                     |
| `success`          | Positive states                    |
| `danger`           | Destructive/error states           |
| `warning`          | Caution states                     |
| `neutral`          | Secondary controls/text            |
| `bg`               | App background                     |
| `surface`          | Card/panel background              |
| `surface-elevated` | Nested/raised background           |
| `text-primary`     | Primary foreground text            |
| `text-secondary`   | Secondary text                     |
| `text-muted`       | Muted metadata                     |
| `border`           | Default borders/dividers           |
| `focus`            | Focus ring/accessibility indicator |
