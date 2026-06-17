import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clearAuth, getUser } from '@/lib/auth';

const NAV = [
  { to: '/manager', label: 'Dashboard', end: true },
  { to: '/manager/menu', label: 'Menu' },
  { to: '/manager/qr', label: 'QR Codes' },
  { to: '/manager/orders', label: 'Orders' },
  { to: '/manager/billing', label: 'Billing' },
  { to: '/manager/users', label: 'Users' },
];

export default function ManagerLayout() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-app-background">
      <header className="sticky top-0 z-30 border-b border-app-border bg-app-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 page-x py-3 sm:py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-dark sm:text-xs">
              ROS Manager
            </p>
            <p className="truncate text-sm text-app-text-secondary">{user?.email}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="shrink-0 rounded-xl"
          >
            Log out
          </Button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto scrollbar-none page-x pb-3">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl page-x py-4 pb-10 sm:py-6 sm:pb-12">
        <Outlet />
      </main>
    </div>
  );
}
