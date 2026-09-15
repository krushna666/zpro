import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_GROUPS: Array<{ label: string; items: Array<{ to: string; label: string }> }> = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard' }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/operators', label: 'Operators' },
      { to: '/buses', label: 'Buses' },
      { to: '/bus-layouts', label: 'Bus Layouts' },
      { to: '/routes', label: 'Routes' },
      { to: '/trips', label: 'Trips' },
      { to: '/seats', label: 'Seats' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/bookings', label: 'Bookings' },
      { to: '/payments', label: 'Payments' },
      { to: '/refunds', label: 'Refunds' },
      { to: '/coupons', label: 'Coupons' },
      { to: '/offers', label: 'Offers' },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/users', label: 'Users' },
      { to: '/reviews', label: 'Reviews' },
      { to: '/support', label: 'Support' },
      { to: '/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/reports', label: 'Reports' },
      { to: '/audit-logs', label: 'Audit Logs' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center px-6">
          <span className="text-lg font-bold text-brand-600">BusGo</span>
          <span className="ml-2 text-xs font-medium text-slate-400">Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `mb-0.5 block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.fullName ?? 'Admin'}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
