import { useEffect } from "react";
import { AuthProvider } from "./stores/auth.context";
import { SettingsProvider, useSettings } from "./stores/settings.context";
import AppRoutes from "./routes";
import { useTranslation } from "react-i18next";
import { ConfirmDialogProvider } from "./components/Common/ConfirmDialogProvider";
import { useAuth } from "./stores/auth.context";
import { applyBrandingIcons } from "./utils/branding";

function RuntimeBrandingSync() {
  const { settings } = useSettings();
  const { user } = useAuth();

  useEffect(() => {
    void applyBrandingIcons(settings.branding);
  }, [settings.branding, user?.id]);

  return null;
}

function AppContent() {
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(settings.locale);
  }, [settings.locale, i18n]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const shouldUseDark =
        settings.theme === "dark" ||
        (settings.theme === "system" && media.matches);

      if (shouldUseDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    if (settings.theme !== "system") {
      return;
    }

    const onChange = () => applyTheme();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings.theme]);

  return (
    <AuthProvider>
      <ConfirmDialogProvider>
        <RuntimeBrandingSync />
        <AppRoutes />
      </ConfirmDialogProvider>
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
