import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { applyStoredBrandingEarly } from "./stores/settings.context";
import "./index.css";
import "./i18n";
import AppErrorBoundary from "./components/Common/AppErrorBoundary";

const debugModeEnabled = import.meta.env.VITE_DEBUG_MODE === "true";

if (debugModeEnabled) {
  try {
    (window as any).__KOST_EXEC__ = ((window as any).__KOST_EXEC__ || 0) + 1;
    const count = (window as any).__KOST_EXEC__;
    const markerText = `exec beacon: ${count} @ ${new Date().toISOString()} path=${window.location.pathname}`;
    let marker = document.getElementById("kost-exec");

    if (!marker) {
      marker = document.createElement("pre");
      marker.id = "kost-exec";
      marker.style.cssText =
        "position:fixed;left:8px;bottom:8px;z-index:99997;background:rgba(11,16,32,.92);color:#7ee787;padding:6px 8px;margin:0;white-space:pre-wrap;font:12px/1.4 monospace;border:1px solid #2a335c;border-radius:6px;max-width:calc(100vw - 16px);";
      (document.body || document.documentElement).appendChild(marker);
    }

    marker.textContent = markerText;
    console.log("[KOST_EXEC]", markerText);
  } catch {
    // Ignore diagnostics rendering issues to avoid affecting app bootstrap.
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const BF_CACHE_RELOAD_GUARD_KEY = "kost:bfcache-reload-ts";
const SW_CLEANUP_RELOAD_GUARD_KEY = "kost:sw-cleanup-reload-ts";

function logLifecycle(
  level: "warn" | "error",
  message: string,
  details?: unknown,
) {
  const payload = {
    href: window.location.href,
    userAgent: navigator.userAgent,
    ...(details ? { details } : {}),
  };
  if (level === "error") {
    console.error(`[AppLifecycle] ${message}`, payload);
    return;
  }
  console.warn(`[AppLifecycle] ${message}`, payload);
}

function setupGlobalErrorHandlers() {
  window.addEventListener("unhandledrejection", (event) => {
    logLifecycle("error", "Unhandled promise rejection", {
      reason: event.reason,
    });
  });

  window.addEventListener("error", (event) => {
    logLifecycle("error", "Unhandled window error", {
      message: event.message,
      stack: event.error?.stack,
      source: event.filename,
      line: event.lineno,
      col: event.colno,
    });
  });

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    logLifecycle("warn", "Vite preload error. Reloading app shell.");
    window.location.reload();
  });
}

function setupIosBfCacheHardening() {
  window.addEventListener("pageshow", (event) => {
    const transitionEvent = event as PageTransitionEvent;
    if (!transitionEvent.persisted) return;

    logLifecycle(
      "warn",
      "pageshow persisted=true detected. Revalidating app state.",
    );
    queryClient.invalidateQueries();

    requestAnimationFrame(() => {
      const root = document.getElementById("root");
      if (root?.hasChildNodes()) return;

      const lastReload = Number(
        sessionStorage.getItem(BF_CACHE_RELOAD_GUARD_KEY) ?? "0",
      );
      if (Date.now() - lastReload < 5000) return;

      sessionStorage.setItem(BF_CACHE_RELOAD_GUARD_KEY, String(Date.now()));
      logLifecycle(
        "warn",
        "Persisted BFCache restore rendered empty root. Reloading once.",
      );
      window.location.reload();
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    queryClient.refetchQueries({ type: "active" });
  });
}

function setupServiceWorkerHardening() {
  if (!import.meta.env.PROD) return;

  const enablePwa = import.meta.env.VITE_ENABLE_PWA === "true";

  if (!enablePwa) {
    console.info("[AppLifecycle] PWA disabled. Unregistering service workers.");

    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      )
      .catch((error) => {
        logLifecycle(
          "warn",
          "Failed to unregister service worker registrations",
          error,
        );
      })
      .finally(() => {
        if ("caches" in window) {
          caches
            .keys()
            .then((cacheNames) =>
              Promise.all(
                cacheNames
                  .filter(
                    (cacheName) =>
                      cacheName.includes("workbox") ||
                      cacheName.includes("navigation-cache"),
                  )
                  .map((cacheName) => caches.delete(cacheName)),
              ),
            )
            .catch((error) => {
              logLifecycle(
                "warn",
                "Failed to clear service worker caches",
                error,
              );
            });
        }

        if (!navigator.serviceWorker.controller) return;

        const lastReload = Number(
          sessionStorage.getItem(SW_CLEANUP_RELOAD_GUARD_KEY) ?? "0",
        );
        if (Date.now() - lastReload < 5000) return;

        sessionStorage.setItem(SW_CLEANUP_RELOAD_GUARD_KEY, String(Date.now()));
        window.location.reload();
      });

    return;
  }

  let refreshing = false;
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    logLifecycle(
      "warn",
      "Service worker controller changed. Reloading to sync chunks.",
    );
    window.location.reload();
  });

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      logLifecycle(
        "warn",
        "Service worker update available. Activating update.",
      );
      updateSW(true);
    },
    onOfflineReady() {
      console.log("[AppLifecycle] App ready to work offline");
    },
    onRegisterError(error) {
      logLifecycle("error", "Service worker registration error", error);
    },
  });
}

applyStoredBrandingEarly();

setupGlobalErrorHandlers();
setupIosBfCacheHardening();
setupServiceWorkerHardening();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
