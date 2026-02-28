import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Locale = 'en' | 'nb';

interface Settings {
  theme: Theme;
  locale: Locale;
}

interface SettingsContextType {
  settings: Settings;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
}

const defaultSettings: Settings = {
  theme: 'light',
  locale: 'nb',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    const browserLang = navigator.language.split('-')[0];
    const detectedLocale = browserLang === 'nb' || browserLang === 'no' ? 'nb' : 'en';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return { theme: prefersDark ? 'dark' : 'light', locale: detectedLocale };
  });

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const setTheme = (theme: Theme) => setSettings((prev) => ({ ...prev, theme }));
  const setLocale = (locale: Locale) => setSettings((prev) => ({ ...prev, locale }));
  const toggleTheme = () =>
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));

  return (
    <SettingsContext.Provider value={{ settings, setTheme, setLocale, toggleTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}
