import { NavLink, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';
import { getDisplayName, getRoleLabel } from '@/utils/welcome';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/users', label: 'Users', icon: '🛡️' },
  { to: '/extinguishers', label: 'Extinguishers', icon: '🧯' },
  { to: '/inspections', label: 'Inspections', icon: '📅' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/compliance', label: 'Compliance', icon: '⚠️' },
  { to: '/reports', label: 'Reports', icon: '📄' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const customerLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/extinguishers', label: 'My Extinguishers', icon: '🧯' },
  { to: '/inspections', label: 'Inspections', icon: '📅' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

const inspectorLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/extinguishers', label: 'Extinguishers', icon: '🧯' },
  { to: '/inspections', label: 'Inspections', icon: '📅' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export function Sidebar() {
  const { user, isAdmin, isInspector } = useAuth();
  const { toggleTheme, isDark } = useDarkMode();
  const dispatch = useAppDispatch();
  const links = isAdmin ? adminLinks : isInspector ? inspectorLinks : customerLinks;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fire-600 to-ember-600 text-lg text-white">
            🔥
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">FEMS</p>
            <p className="text-xs text-slate-500">Fire Safety Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-gradient-to-r from-fire-600/10 to-ember-600/10 text-fire-700 dark:text-fire-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="mb-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Welcome, {getDisplayName(user)}
          </p>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <p className="mt-1 text-xs text-fire-600">{getRoleLabel(user?.role)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={toggleTheme}>
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => dispatch(logout())}
          >
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto">
        <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
          <p className="font-bold text-fire-700 dark:text-fire-400">FEMS Portal</p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
