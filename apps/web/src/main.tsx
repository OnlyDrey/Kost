import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import './i18n';
import AppErrorBoundary from './components/Common/AppErrorBoundary';

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

const BF_CACHE_RELOAD_GUARD_KEY = 'kost:bfcache-reload-ts';

function logLifecycle(level: 'warn' | 'error', message: string, details?: unknown) {
  const payload = {
    href: window.location.href,
    userAgent: navigator.userAgent,
    ...(details ? { details } : {}),
  };
  if (level === 'error') {
    console.error(`[AppLifecycle] ${message}`, payload);
    return;
  }
  console.warn(`[AppLifecycle] ${message}`, payload);
}

function setupGlobalErrorHandlers() {
  window.addEventListener('unhandledrejection', (event) => {
    logLifecycle('error', 'Unhandled promise rejection', {
      reason: event.reason,
    });
  });

  window.addEventListener('error', (event) => {
    logLifecycle('error', 'Unhandled window error', {
      message: event.message,
      stack: event.error?.stack,
      source: event.filename,
      line: event.lineno,
      col: event.colno,
    });
  });

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    logLifecycle('warn', 'Vite preload error. Reloading app shell.');
    window.location.reload();
  });
}

function setupIosBfCacheHardening() {
  window.addEventListener('pageshow', (event) => {
    const transitionEvent = event as PageTransitionEvent;
    if (!transitionEvent.persisted) return;

    logLifecycle('warn', 'pageshow persisted=true detected. Revalidating app state.');
    queryClient.invalidateQueries();

    requestAnimationFrame(() => {
      const root = document.getElementById('root');
      if (root?.hasChildNodes()) return;

      const lastReload = Number(sessionStorage.getItem(BF_CACHE_RELOAD_GUARD_KEY) ?? '0');
      if (Date.now() - lastReload < 5000) return;

      sessionStorage.setItem(BF_CACHE_RELOAD_GUARD_KEY, String(Date.now()));
      logLifecycle('warn', 'Persisted BFCache restore rendered empty root. Reloading once.');
      window.location.reload();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    queryClient.refetchQueries({ type: 'active' });
  });
}

function setupServiceWorkerHardening() {
  if (!import.meta.env.PROD) return;

  let refreshing = false;
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    logLifecycle('warn', 'Service worker controller changed. Reloading to sync chunks.');
    window.location.reload();
  });

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      logLifecycle('warn', 'Service worker update available. Activating update.');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[AppLifecycle] App ready to work offline');
    },
    onRegisterError(error) {
      logLifecycle('error', 'Service worker registration error', error);
    },
  });
}

setupGlobalErrorHandlers();
setupIosBfCacheHardening();
setupServiceWorkerHardening();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
