# Design Tokens (Single Source of Truth)

## Token contract

Defined in `apps/web/src/index.css` as RGB triplets:

- Brand/state: `--color-primary`, `--color-success`, `--color-danger`, `--color-warning`, `--color-neutral`, `--color-focus`
- Surfaces: `--color-bg`, `--color-surface`, `--color-surface-elevated`
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- Structure: `--color-border`

Primary color families for Profilering live in `apps/web/src/theme/primaryColorFamilies.ts` and use Tailwind `*-500` RGB values.

## Tailwind semantic mapping

Defined in `apps/web/tailwind.config.js`:

- `primary`, `success`, `danger`, `warning`, `neutral`
- `bg`, `surface`, `surface-elevated`
- `text-primary`, `text-secondary`, `text-muted`
- `border`, `focus`

Use semantic utilities such as:

- `bg-primary`, `text-primary`, `border-border`, `ring-focus`
- `bg-surface`, `text-text-secondary`, `text-text-muted`

## Profilering primary-family rules

Allowed families (`*-500`):
`red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`.

Excluded families: `gray`, `slate`, `zinc`, `neutral`, `stone`.

## Usage rules

1. No raw hex colors in component code.
2. No direct palette family utilities in migrated components.
3. Use semantic tokens for all new/touched styles.
4. Delete actions may use danger styling; non-delete confirms should stay primary.

## Branding assets vs color tokens

Color tokens are semantic CSS variables used by Tailwind classes.
Branding assets are persisted visual resources and runtime icon outputs:

- `branding.logoDataUrl` (custom uploaded logo; base64 data URL)
- fallback logo: `/logo-mark.png`
- `branding.appIconBackground` (hex input used for generated app icon/favicons)

### Branding fallback logic

1. Custom uploaded logo (`branding.logoDataUrl`) if present.
2. Default project logo (`/logo-mark.png`) if no custom logo.

App icon background fallback:

1. Valid custom hex (`branding.appIconBackground`)
2. Default `#0B1020`
