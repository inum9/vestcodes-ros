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
      <header className="border-b border-app-border bg-app-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-dark">ROS Manager</p>
            <p className="text-sm text-app-text-secondary">{user?.email}</p>
          </div>
          <Button type="button" variant="outline" onClick={handleLogout} className="rounded-xl">
            Log out
          </Button>        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
