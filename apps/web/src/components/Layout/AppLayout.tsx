import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../stores/auth.context';
import { useSettings } from '../../stores/settings.context';

const NAV_ITEMS = [
  { key: 'nav.dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'nav.invoices', icon: Receipt, path: '/invoices' },
  { key: 'nav.periods', icon: Calendar, path: '/periods' },
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
    </button>
  );
}

function Sidebar({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { settings, toggleTheme, setLocale } = useSettings();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Kost</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('app.tagline', 'Expense tracking')}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ key, icon, path }) => (
          <NavLink
            key={path}
            icon={icon}
            label={t(key)}
            active={location.pathname.startsWith(path)}
            onClick={() => onNavigate(path)}
          />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-0.5">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{settings.theme === 'dark' ? t('settings.light') : t('settings.dark')}</span>
        </button>
        <button
          onClick={() => setLocale(settings.locale === 'en' ? 'nb' : 'en')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings size={18} />
          <span>{settings.locale === 'en' ? 'Norsk' : 'English'}</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            {isAdmin && <p className="text-xs text-indigo-600 dark:text-indigo-400">Admin</p>}
          </div>
          <button
            onClick={logout}
            title={t('nav.logout')}
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <aside className="hidden md:flex md:flex-shrink-0 w-64">
        <Sidebar onNavigate={handleNavigate} />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={handleNavigate} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu size={22} />
          </button>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Kost</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
