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
  locale: 'nb', // Default to Norwegian
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }

    // Detect user's preferred language
    const browserLang = navigator.language.split('-')[0];
    const detectedLocale = browserLang === 'nb' || browserLang === 'no' ? 'nb' : 'en';

    // Detect user's preferred theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const detectedTheme = prefersDark ? 'dark' : 'light';

    return {
      theme: detectedTheme,
      locale: detectedLocale,
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const setTheme = (theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const setLocale = (locale: Locale) => {
    setSettings((prev) => ({ ...prev, locale }));
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const value: SettingsContextType = {
    settings,
    setTheme,
    setLocale,
    toggleTheme,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
