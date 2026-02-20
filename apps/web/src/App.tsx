import { useEffect } from 'react';
import { AuthProvider } from './stores/auth.context';
import { SettingsProvider, useSettings } from './stores/settings.context';
import AppRoutes from './routes';
import { useTranslation } from 'react-i18next';

function AppContent() {
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(settings.locale);
  }, [settings.locale, i18n]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
