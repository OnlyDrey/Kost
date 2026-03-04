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
  PRIMARY_COLOR_OPTIONS,
  type PrimaryColorFamily,
} from "../theme/primaryColorFamilies";
import {
  DEFAULT_APP_ICON_BACKGROUND,
  applyBrandingIcons,
  isValidHexColor,
} from "../utils/branding";

type Theme = "light" | "dark" | "system";
type Locale = "en" | "nb";

export type BrandingPreset = PrimaryColorFamily;

export interface BrandingSettings {
  appTitle: string;
  logoDataUrl: string;
  logoUrl: string;
  primaryPreset: BrandingPreset;
  appIconBackground: string;
  showVendorImages: boolean;
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
  logoDataUrl: "",
  logoUrl: "",
  primaryPreset: DEFAULT_PRIMARY_COLOR_FAMILY,
  appIconBackground: DEFAULT_APP_ICON_BACKGROUND,
  showVendorImages: true,
};

const defaultSettings: Settings = {
  theme: "system",
  locale: "nb",
  branding: defaultBranding,
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

function normalizeBrandingSettings(
  branding?: Partial<BrandingSettings>,
): BrandingSettings {
  return {
    appTitle: branding?.appTitle?.trim() || defaultBranding.appTitle,
    logoDataUrl: branding?.logoDataUrl?.trim() || "",
    logoUrl: branding?.logoUrl?.trim() || "",
    primaryPreset:
      branding?.primaryPreset &&
      branding.primaryPreset in PRIMARY_COLOR_FAMILIES
        ? branding.primaryPreset
        : defaultBranding.primaryPreset,
    appIconBackground:
      branding?.appIconBackground && isValidHexColor(branding.appIconBackground)
        ? branding.appIconBackground
        : defaultBranding.appIconBackground,
    showVendorImages:
      branding?.showVendorImages === undefined
        ? defaultBranding.showVendorImages
        : Boolean(branding.showVendorImages),
  };
}

function applyBrandingToDocument(branding: BrandingSettings) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const presetKey: PrimaryColorFamily =
    branding.primaryPreset in PRIMARY_COLOR_FAMILIES
      ? branding.primaryPreset
      : DEFAULT_PRIMARY_COLOR_FAMILY;
  const preset =
    PRIMARY_COLOR_OPTIONS.find((option) => option.value === presetKey) ??
    PRIMARY_COLOR_OPTIONS[0];

  root.dataset.brandPreset = branding.primaryPreset;
  root.style.setProperty("--color-primary", preset.rgb);
  root.style.setProperty(
    "--color-primary-hover",
    preset.hoverRgb ?? preset.rgb,
  );
  root.style.setProperty(
    "--color-primary-pressed",
    preset.pressedRgb ?? preset.rgb,
  );
  root.style.setProperty("--color-secondary", preset.rgb);
  root.style.setProperty(
    "--color-secondary-hover",
    preset.hoverRgb ?? preset.rgb,
  );
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
        branding: normalizeBrandingSettings(
          parsed.branding as Partial<BrandingSettings>,
        ),
      };
    } catch {
      return defaultSettings;
    }
  }

  const browserLang = navigator.language.split("-")[0];
  const detectedLocale: Locale =
    browserLang === "nb" || browserLang === "no" ? "nb" : "en";
  return {
    ...defaultSettings,
    locale: detectedLocale,
    branding: normalizeBrandingSettings(defaultSettings.branding),
  };
}

export function applyStoredBrandingEarly() {
  const initial = resolveInitialSettings();
  applyBrandingToDocument(initial.branding);
  void applyBrandingIcons(initial.branding);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const initial = resolveInitialSettings();
    const branding = normalizeBrandingSettings(initial.branding);
    applyBrandingToDocument(branding);
    void applyBrandingIcons(branding);
    return { ...initial, branding };
  });

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
    applyBrandingToDocument(settings.branding);
    void applyBrandingIcons(settings.branding);
  }, [settings]);

  const setTheme = (theme: Theme) =>
    setSettings((prev) => ({ ...prev, theme }));
  const setLocale = (locale: Locale) =>
    setSettings((prev) => ({ ...prev, locale }));
  const setBranding = (branding: Partial<BrandingSettings>) =>
    setSettings((prev) => ({
      ...prev,
      branding: normalizeBrandingSettings({ ...prev.branding, ...branding }),
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
