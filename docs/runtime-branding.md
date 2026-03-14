# Runtime branding and icon generation

Kost now supports runtime branding assets without rebuilding the frontend bundle.

## Source of truth

1. Uploaded logo raster (`/uploads/branding/<familyId>/source.*`) when present.
2. Remote logo URL if configured.
3. Bundled default raster fallback (`/apple-touch-icon.png`).

## Generated assets

The backend writes generated icon assets to `/uploads/branding/<familyId>/generated`:

- `favicon-32.png`
- `apple-180.png`
- `pwa-192.png`
- `pwa-512.png`
- `pwa-192-maskable.png`
- `pwa-512-maskable.png`
- `preview-512.png`

Generation is done by `scripts/generate_branding_assets.py` and is invoked automatically when branding settings are updated.

If Python/Pillow generation fails, the backend falls back to bundled default PNG assets and still rewrites the runtime manifest.

## Runtime behavior

- Branding settings call `/api/family/branding` and `/api/family/branding/logo`.
- API stores branding config under a runtime-writable folder (outside the frontend bundle).
- API returns versioned URLs (`version` counter), and frontend updates icon links + manifest URL at runtime.
- Manifest is generated as `/uploads/branding/<familyId>/manifest.webmanifest` and references versioned runtime icon assets.

## Root cause of previous installed-icon issue

The old chain mixed browser-side preview/data-url rendering with a static manifest that still referenced SVG icons. That caused preview/install mismatches, stale install assets, and inconsistent platform results. The new flow aligns preview, favicon links, manifest icons, and generated install icons from the same canonical raster source.

## Cache-busting strategy

- Branding changes increment a persistent `version` in runtime config.
- All icon URLs and manifest references include `?v=<version>`.
- Missing generated assets are auto-regenerated from canonical source.

## Platform limitation

Installed PWA icons are still cached aggressively by browsers/OS launchers. Users may need to reinstall the PWA or clear site data for icon changes to appear immediately on home screen/app launcher.
