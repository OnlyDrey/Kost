# Kost Branding Assets

## Current asset mapping

| Purpose | File | Notes |
|---------|------|-------|
| Browser favicon | `public/favicon.svg` | SVG; referenced in `index.html` |
| iOS Add-to-Home-Screen icon | `public/apple-touch-icon.png` | PNG 180×180; required by iOS Safari |
| PWA install icon (small) | `public/pwa-192x192.png` | PNG 192×192 |
| PWA install icon (large) | `public/pwa-512x512.png` | PNG 512×512 |
| App icon (SVG source) | `public/app-icon.svg` | Master vector; used in manifest |
| Logo mark (sidebar/header) | `public/logo-mark.svg` | Sidebar logo component |

## Replacing icons with custom artwork

1. Replace `public/app-icon.svg` with your SVG source.
2. Export the following PNG sizes from the SVG:
   - `public/apple-touch-icon.png` — 180×180 (iOS)
   - `public/pwa-192x192.png` — 192×192 (Android / desktop PWA)
   - `public/pwa-512x512.png` — 512×512 (splash screen / maskable)
3. Rebuild the app (`npm run build --workspace=apps/web`) so Vite picks up the new files.

## iOS-specific notes

- `apple-touch-icon.png` must be a **PNG** file. iOS Safari ignores SVG for home-screen icons.
- The `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` tag in `index.html` controls which icon iOS uses.
- The meta tags `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, and `apple-mobile-web-app-status-bar-style` in `index.html` control PWA standalone behaviour on iOS.
