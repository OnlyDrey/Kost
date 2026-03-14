# Runtime branding and icon generation

Kost now supports runtime branding assets without rebuilding the frontend bundle.

## Source of truth

1. Uploaded logo raster (`/uploads/branding/source.*`) when present.
2. Remote logo URL if configured.
3. Bundled default logo fallback.

## Generated assets

The backend writes generated icon assets to `/uploads/branding/generated`:

- `favicon-32.png`
- `apple-180.png`
- `pwa-192.png`
- `pwa-512.png`
- `preview-512.png`

Generation is done by `scripts/generate_branding_assets.py` and invoked automatically when branding is updated.

If Pillow is unavailable or generation fails, the backend falls back to bundled default PNG assets.

## Runtime behavior

- Branding settings call `/api/family/branding` and `/api/family/branding/logo`.
- The app updates link tags at runtime to generated assets.
- The web manifest is updated at runtime to point to generated icon URLs.

## Root cause of previous icon issue

The install icon pipeline was previously driven by SVG/data-url generation in the browser, while `manifest.webmanifest` pointed to static SVG icons (`logo-mark.svg`). This mismatch caused inconsistent favicon/manifest/install icon rendering across browsers and stale install icon caching.

## Platform limitation

Installed PWA icons are heavily cached by mobile/desktop platforms. Users may need to reinstall or clear browser site data before seeing newly generated install icons.
