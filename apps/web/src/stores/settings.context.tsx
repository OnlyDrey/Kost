import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  DEFAULT_PRIMARY_COLOR_FAMILY,
  PRIMARY_COLOR_FAMILIES,
  type PrimaryColorFamily,
} from "../theme/primaryColorFamilies";

type Theme = "light" | "dark" | "system";
type Locale = "en" | "nb";

export type BrandingPreset = PrimaryColorFamily;

export interface BrandingSettings {
  appTitle: string;
  logoUrl: string;
  primaryPreset: BrandingPreset;
}

interface Settings {
  theme: Theme;
  locale: Locale;
  branding: BrandingSettings;
}

interface SettingsContextType {
  settings: Settings;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setBranding: (branding: Partial<BrandingSettings>) => void;
  toggleTheme: () => void;
}

const defaultBranding: BrandingSettings = {
  appTitle: "Kost",
  logoUrl: "",
  primaryPreset: DEFAULT_PRIMARY_COLOR_FAMILY,
};

const defaultSettings: Settings = {
  theme: "system",
  locale: "nb",
  branding: defaultBranding,
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

function applyBrandingToDocument(branding: BrandingSettings) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const preset =
    PRIMARY_COLOR_FAMILIES[branding.primaryPreset] ??
    PRIMARY_COLOR_FAMILIES[DEFAULT_PRIMARY_COLOR_FAMILY];

  root.dataset.brandPreset = branding.primaryPreset;
  root.style.setProperty("--color-primary", preset.rgb);
  root.style.setProperty("--color-primary-hover", preset.rgb);
  root.style.setProperty("--color-primary-pressed", preset.rgb);
  root.style.setProperty("--color-secondary", preset.rgb);
  root.style.setProperty("--color-secondary-hover", preset.rgb);
  root.style.setProperty("--color-focus", preset.rgb);
  root.style.setProperty("--color-info", preset.rgb);
  root.style.setProperty("--color-info-soft", preset.rgb);

  document.title = branding.appTitle?.trim() || defaultBranding.appTitle;
}

function resolveInitialSettings(): Settings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const stored = localStorage.getItem("settings");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<Settings>;
      return {
        ...defaultSettings,
        ...parsed,
        branding: {
          ...defaultBranding,
          ...(parsed.branding ?? {}),
        },
      };
    } catch {
      return defaultSettings;
    }
  }

  const browserLang = navigator.language.split("-")[0];
  const detectedLocale: Locale =
    browserLang === "nb" || browserLang === "no" ? "nb" : "en";
  return { ...defaultSettings, locale: detectedLocale };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const initial = resolveInitialSettings();
    applyBrandingToDocument(initial.branding);
    return initial;
  });

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
    applyBrandingToDocument(settings.branding);
  }, [settings]);

  const setTheme = (theme: Theme) =>
    setSettings((prev) => ({ ...prev, theme }));
  const setLocale = (locale: Locale) =>
    setSettings((prev) => ({ ...prev, locale }));
  const setBranding = (branding: Partial<BrandingSettings>) =>
    setSettings((prev) => ({
      ...prev,
      branding: { ...prev.branding, ...branding },
    }));

  const toggleTheme = () =>
    setSettings((prev) => {
      const nextTheme =
        prev.theme === "light"
          ? "dark"
          : prev.theme === "dark"
            ? "system"
            : "light";
      return { ...prev, theme: nextTheme };
    });

  return (
    <SettingsContext.Provider
      value={{ settings, setTheme, setLocale, setBranding, toggleTheme }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
