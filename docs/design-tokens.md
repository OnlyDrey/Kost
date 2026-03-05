# Design Tokens

## Token contract

Semantic color tokens are defined in `apps/web/src/index.css` as RGB triplets:

- Brand/state: `--color-primary`, `--color-success`, `--color-danger`, `--color-warning`, `--color-neutral`, `--color-focus`
- Surfaces: `--color-bg`, `--color-surface`, `--color-surface-elevated`
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- Structure: `--color-border`

Primary color family mappings live in `apps/web/src/theme/primaryColorFamilies.ts`.

## Tailwind semantic mapping

Defined in `apps/web/tailwind.config.js`:

- `primary`, `success`, `danger`, `warning`, `neutral`
- `bg`, `surface`, `surface-elevated`
- `text-primary`, `text-secondary`, `text-muted`
- `border`, `focus`

Use semantic utilities such as `bg-primary`, `text-text-secondary`, `border-border`, and `ring-focus`.

## Rules

1. No raw hex colors in component code.
2. Prefer semantic tokens over direct palette family classes.
3. Use existing shared components for consistent visual sizing and states.
