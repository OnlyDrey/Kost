import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type Locale = "en" | "nb";
export type BrandingPreset = "indigo" | "emerald" | "violet";

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

interface BrandPresetTokens {
  primary: string;
  focus: string;
  info: string;
}

export const BRAND_PRESET_TOKENS: Record<BrandingPreset, BrandPresetTokens> = {
  indigo: {
    primary: "99 102 241",
    focus: "99 102 241",
    info: "99 102 241",
  },
  emerald: {
    primary: "16 185 129",
    focus: "16 185 129",
    info: "16 185 129",
  },
  violet: {
    primary: "139 92 246",
    focus: "139 92 246",
    info: "139 92 246",
  },
};

const defaultBranding: BrandingSettings = {
  appTitle: "Kost",
  logoUrl: "",
  primaryPreset: "indigo",
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
    BRAND_PRESET_TOKENS[branding.primaryPreset] ?? BRAND_PRESET_TOKENS.indigo;

  root.dataset.brandPreset = branding.primaryPreset;
  root.style.setProperty("--color-primary", preset.primary);
  root.style.setProperty("--color-primary-hover", preset.primary);
  root.style.setProperty("--color-primary-pressed", preset.primary);
  root.style.setProperty("--color-secondary", preset.primary);
  root.style.setProperty("--color-secondary-hover", preset.primary);
  root.style.setProperty("--color-focus", preset.focus);
  root.style.setProperty("--color-info", preset.info);
  root.style.setProperty("--color-info-soft", preset.info);

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
