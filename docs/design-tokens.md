# Design Tokens (Single Source of Truth)

## Purpose

These tokens define the semantic color contract for the web app. Tailwind consumes them through CSS variables so components can use semantic utilities rather than palette family classes.

## CSS variable tokens

Defined in: `apps/web/src/index.css`

### Brand/state tokens

- `--color-primary`
- `--color-primary-hover`
- `--color-primary-pressed`
- `--color-secondary`
- `--color-secondary-hover`
- `--color-success`
- `--color-success-soft`
- `--color-danger`
- `--color-danger-soft`
- `--color-warning`
- `--color-warning-soft`
- `--color-neutral`
- `--color-info`
- `--color-info-soft`

### Surface/content tokens

- `--color-bg`
- `--color-surface`
- `--color-surface-elevated`
- `--color-border`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-text-muted`
- `--color-disabled`
- `--color-focus`

## Tailwind semantic mappings

Defined in: `apps/web/tailwind.config.js`

- `primary` -> `rgb(var(--color-primary) / <alpha-value>)`
- `success` -> `rgb(var(--color-success) / <alpha-value>)`
- `danger` -> `rgb(var(--color-danger) / <alpha-value>)`
- `warning` -> `rgb(var(--color-warning) / <alpha-value>)`
- `neutral` -> `rgb(var(--color-neutral) / <alpha-value>)`
- `bg` -> `rgb(var(--color-bg) / <alpha-value>)`
- `surface` -> `rgb(var(--color-surface) / <alpha-value>)`
- `surface-elevated` -> `rgb(var(--color-surface-elevated) / <alpha-value>)`
- `border` -> `rgb(var(--color-border) / <alpha-value>)`
- `focus` -> `rgb(var(--color-focus) / <alpha-value>)`
- `text-primary` -> `rgb(var(--color-text-primary) / <alpha-value>)`
- `text-secondary` -> `rgb(var(--color-text-secondary) / <alpha-value>)`
- `text-muted` -> `rgb(var(--color-text-muted) / <alpha-value>)`

## Usage rules

1. **No raw hex values in components**.
2. **No direct palette families** (`indigo-*`, `red-*`, `gray-*`, etc.) in migrated components.
3. Prefer semantic classes:
   - `bg-surface`, `bg-primary`, `bg-danger/15`
   - `text-text-primary`, `text-text-secondary`, `text-danger`
   - `border-border`, `ring-focus`
4. Destructive UI should use `danger` tokens only when the action is destructive.

## Brand presets

Current curated presets:

- `indigo` (default)
- `emerald`
- `violet`

These presets update primary/focus/info tokens and are persisted through settings.

## Guardrail

Run advisory check:

- `npm run check:color-guard`

This script reports direct family classes and raw hex usage in component files to keep migration on track.
