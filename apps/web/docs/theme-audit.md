# Theme color audit (Kost Web)

## Theme-driven tokens/classes

These should follow selected primary family (`--color-primary`):

- `bg-primary`, `text-primary`, `border-primary`
- `focus:ring-focus`
- Active nav/button/chip states using `primary` utilities

## Status colors (not theme-driven)

These remain semantic:

- Success / active: green family
- Warning / paused: yellow/amber family
- Danger / canceled/delete: red family

## Explicit exceptions

- Edit action icon/button is fixed to violet-500 family for consistency across themes.
- Any other hardcoded color must either be semantic status color or be migrated to primary token classes.
