import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
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
  theme: 'system',
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
    return { theme: 'system', locale: detectedLocale };
  });

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const setTheme = (theme: Theme) => setSettings((prev) => ({ ...prev, theme }));
  const setLocale = (locale: Locale) => setSettings((prev) => ({ ...prev, locale }));
  const toggleTheme = () =>
    setSettings((prev) => {
      const nextTheme = prev.theme === 'light' ? 'dark' : prev.theme === 'dark' ? 'system' : 'light';
      return { ...prev, theme: nextTheme };
    });

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
