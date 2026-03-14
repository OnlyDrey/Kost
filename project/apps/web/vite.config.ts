import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // apple-touch-icon.png is required for iOS "Add to Home Screen" feature
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'app-icon.svg'],
      manifest: {
        name: 'Kost',
        short_name: 'Kost',
        description: 'Shared expense tracking application',
        theme_color: '#0B1020',
        background_color: '#0B1020',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Precache hashed JS/CSS/images but NOT HTML.
        // Excluding HTML prevents the iOS Safari white-screen bug after deployment:
        // a stale cached index.html references chunk hashes that no longer exist,
        // causing the browser to fail loading JS → blank white page on hard refresh.
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        // No navigateFallback — navigation is handled by NetworkFirst runtime cache
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Navigation requests: always fetch fresh index.html from network.
          // Fall back to cache only when truly offline.
          // fetchOptions.cache = 'no-store' forces the fetch inside the SW to
          // bypass the browser HTTP cache so that stale index.html with old
          // chunk hashes is never served — the primary fix for the iOS Safari
          // blank-screen bug after deployment.
          {
            urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'navigation-cache',
              networkTimeoutSeconds: 5,
              fetchOptions: {
                cache: 'no-store',
              },
            }
          },
          // Relative API calls (/api/*)
          {
            urlPattern: /^\/api\/.*/,
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
            }
          },
          // Runtime branding manifest must always revalidate so installed PWA
          // metadata can detect icon updates.
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.startsWith('/uploads/branding/') &&
              url.pathname.endsWith('/manifest.webmanifest'),
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'branding-manifest-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [200],
              },
            }
          },
          // Runtime-generated branding icons are versioned and can be safely
          // cached; updated URLs are fetched when version changes.
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.startsWith('/uploads/branding/') &&
              url.pathname.includes('/generated/') &&
              /\.(png|ico)$/i.test(url.pathname),
            handler: 'StaleWhileRevalidate' as const,
            options: {
              cacheName: 'branding-icons-cache',
              cacheableResponse: {
                statuses: [200],
              },
            }
          },
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2019',
    modulePreload: { polyfill: true }
  },
  esbuild: {
    target: 'es2019'
  }
});
