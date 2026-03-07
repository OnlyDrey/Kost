import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.context";
import { useSettings } from "../../stores/settings.context";
import RoleBadge from "../Common/RoleBadge";
import { FOCUS_RING } from "../Common/focusStyles";
import {
  getCurrentLogoSource,
  getDefaultLogoUrl,
} from "../../branding/brandingAssets";

const NAV_ITEMS = [
  { key: "nav.overview", icon: LayoutDashboard, path: "/overview" },
  { key: "nav.periods", icon: Calendar, path: "/periods" },
  { key: "nav.subscriptions", icon: RefreshCw, path: "/subscriptions" },
  { key: "nav.importExport", icon: Upload, path: "/import-export" },
  { key: "nav.settings", icon: Settings, path: "/settings" },
];

function NavLink({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${FOCUS_RING} ${
        active
          ? "border-primary/50 bg-primary/15 text-primary dark:bg-primary/20"
          : "border-transparent text-muted-foreground hover:bg-surface-elevated"
      }`}
    >
      <Icon
        size={18}
        className={active ? "text-primary" : "text-muted-foreground"}
      />
      <span>{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
    </button>
  );
}

function UserAvatar({
  name,
  avatarUrl,
  size = 8,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div
      className={`${sizeClass} rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function Sidebar({
  onNavigate,
  appTitle,
  appLogoSrc,
}: {
  onNavigate: (path: string) => void;
  appTitle: string;
  appLogoSrc: string;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings, setTheme } = useSettings();

  const roleLabel =
    user?.role === "ADMIN"
      ? t("users.admin")
      : user?.role === "CHILD"
        ? t("users.junior")
        : t("users.adult");

  const themeOptions = [
    {
      key: "system",
      icon: SlidersHorizontal,
      ariaLabel: `${t("settings.theme")}: ${t("settings.system")}`,
    },
    {
      key: "light",
      icon: Sun,
      ariaLabel: `${t("settings.theme")}: ${t("settings.light")}`,
    },
    {
      key: "dark",
      icon: Moon,
      ariaLabel: `${t("settings.theme")}: ${t("settings.dark")}`,
    },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <img
            src={appLogoSrc}
            alt={appTitle}
            className="w-7 h-7 object-contain flex-shrink-0"
            onError={(event) => {
              event.currentTarget.src = getDefaultLogoUrl();
            }}
          />
          <span className="text-xl font-bold text-primary">{appTitle}</span>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">{t("app.tagline")}</p>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ key, icon, path }) => (
            <NavLink
              key={path}
              icon={icon}
              label={t(key)}
              active={location.pathname.startsWith(path)}
              onClick={() => onNavigate(path)}
            />
          ))}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex justify-center">
          <div className="w-64 h-10 p-1 rounded-full bg-slate-100/80 border border-slate-300 shadow-sm dark:bg-white/5 dark:border-white/10 dark:shadow-none flex items-center gap-1">
            {themeOptions.map(({ key, icon: Icon, ariaLabel }) => {
              const selected = settings.theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={ariaLabel}
                  title={ariaLabel}
                  onClick={() => setTheme(key)}
                  className={`flex-1 h-8 rounded-full grid place-items-center transition ${FOCUS_RING} ${
                    selected
                      ? "bg-primary/20 text-primary dark:bg-primary/25 dark:text-primary"
                      : "text-muted-foreground hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 px-1 mt-1">
          <button
            type="button"
            onClick={() => onNavigate("/settings?tab=profile")}
            className={`flex-1 flex items-center gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-surface-elevated ${FOCUS_RING}`}
          >
            <UserAvatar
              name={user?.name ?? ""}
              avatarUrl={user?.avatarUrl}
              size={8}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.name}
              </p>
              <RoleBadge
                role={user?.role ?? "ADULT"}
                label={roleLabel}
                alwaysShowLabel
                className="mt-0.5"
              />
            </div>
          </button>
          <button
            onClick={logout}
            title={t("nav.logout")}
            className={`h-11 w-11 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors ${FOCUS_RING}`}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const appTitle = settings.branding.appTitle?.trim() || "Kost";
  const appLogoSrc = getCurrentLogoSource(settings.branding).src;

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div
      className="flex overflow-hidden bg-gray-50 dark:bg-gray-950"
      style={{ height: "100dvh" }}
    >
      <aside className="hidden md:flex md:flex-shrink-0 w-64">
        <Sidebar
          onNavigate={handleNavigate}
          appTitle={appTitle}
          appLogoSrc={appLogoSrc}
        />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          onNavigate={handleNavigate}
          appTitle={appTitle}
          appLogoSrc={appLogoSrc}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img
              src={appLogoSrc}
              alt={appTitle}
              className="w-6 h-6 object-contain flex-shrink-0"
              onError={(event) => {
                event.currentTarget.src = getDefaultLogoUrl();
              }}
            />
            <span className="text-lg font-bold text-primary">{appTitle}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 md:pl-12 lg:pl-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
