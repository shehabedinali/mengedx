import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

// ─── Icon helpers ────────────────────────────────────────────────────────────
const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  companies: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  managers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="9" cy="8" r="3" /><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5" /><path d="M16 3.13a4 4 0 0 1 0 7.75M22 20c0-3-2.5-5.5-6-5.5" /></svg>,
  buses: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M7 18v2M17 18v2" /><circle cx="7" cy="15" r="1" fill="currentColor" /><circle cx="17" cy="15" r="1" fill="currentColor" /></svg>,
  drivers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  routes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M3 12h18M3 6l4 6-4 6M21 6l-4 6 4 6" /></svg>,
  trips: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
  dispatch: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  bookings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" /><path d="M12 12v4M10 14h4" /></svg>,
  seatmaps: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
  staff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="9" cy="8" r="3" /><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5" /><path d="M16 3.13a4 4 0 0 1 0 7.75M22 20c0-3-2.5-5.5-6-5.5" /></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
  tickerOffice: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
};

// ─── Nav definitions per role ─────────────────────────────────────────────────
const superAdminNav = [
  { to: '/', label: 'Dashboard', icon: icons.dashboard },
  { to: '/companies', label: 'Companies', icon: icons.companies },
  { to: '/managers', label: 'Users', icon: icons.managers },
  { to: '/buses', label: 'Buses', icon: icons.buses },
  { to: '/drivers', label: 'Drivers', icon: icons.drivers },
  { to: '/routes', label: 'Routes', icon: icons.routes },
  { to: '/trips', label: 'Trips', icon: icons.trips },
  { to: '/bookings', label: 'Bookings', icon: icons.bookings },
  { to: '/seatmaps', label: 'Seat Maps', icon: icons.seatmaps },
  { to: '/ticker-offices', label: 'Ticker Offices', icon: icons.tickerOffice },
  { to: '/staff', label: 'Staff', icon: icons.staff },
  { to: '/reports', label: 'Reports', icon: icons.reports },
];

// Admin: company-scoped — Buses, Drivers, Trips, Bookings, Staff only
const adminNav = [
  { to: '/', label: 'Dashboard', icon: icons.dashboard },
  { to: '/buses', label: 'Buses', icon: icons.buses },
  { to: '/drivers', label: 'Drivers', icon: icons.drivers },
  { to: '/trips', label: 'Trips', icon: icons.trips },
  { to: '/bookings', label: 'Bookings', icon: icons.bookings },
  { to: '/ticker-offices', label: 'Ticker Offices', icon: icons.tickerOffice },
  { to: '/staff', label: 'Staff', icon: icons.staff },
];

// Manager: company-scoped, operational focus
const managerNav = [
  { to: '/', label: 'Dashboard', icon: icons.dashboard },
  { to: '/buses', label: 'Buses', icon: icons.buses },
  { to: '/drivers', label: 'Drivers', icon: icons.drivers },
  { to: '/trips', label: 'Trips', icon: icons.trips },
  { to: '/dispatch', label: 'Daily Dispatch', icon: icons.dispatch },
  { to: '/bookings', label: 'Bookings', icon: icons.bookings },
  { to: '/ticker-offices', label: 'Ticker Offices', icon: icons.tickerOffice },
  { to: '/staff', label: 'Staff', icon: icons.staff },
];

// Dispatcher: read-only operational view — no CRUD
const dispatcherNav = [
  { to: '/', label: 'Dashboard', icon: icons.dashboard },
  { to: '/routes', label: 'Routes', icon: icons.routes },
  { to: '/trips', label: 'Trips', icon: icons.trips },
  { to: '/buses', label: 'Buses', icon: icons.buses },
  { to: '/drivers', label: 'Drivers', icon: icons.drivers },
  { to: '/dispatch', label: 'Daily Dispatch', icon: icons.dispatch },
];

// Role badge colours
const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-indigo-100 text-indigo-700',
  dispatcher: 'bg-orange-100 text-orange-700',
  ticketer: 'bg-blue-100 text-blue-700',
};

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);

  const role = user?.role?.toLowerCase() ?? '';
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const isDispatcher = role === 'dispatcher';

  const navItems = isSuperAdmin ? superAdminNav
    : isAdmin ? adminNav
      : isDispatcher ? dispatcherNav
        : managerNav;

  const portalLabel = isSuperAdmin ? 'Super Admin'
    : isAdmin ? 'Admin Portal'
      : isDispatcher ? 'Dispatcher'
        : 'Manager Portal';

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-200 flex flex-col z-40">
      <div className="px-5 py-4 border-b border-gray-200">
        <span className="text-sm font-bold text-black tracking-tight">MengedX</span>
        <p className="text-xs text-gray-400 mt-0.5">{portalLabel}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-0.5">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-gray-100 text-black font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-700 font-medium truncate">{user?.name || 'User'}</p>
            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-500'}`}>
              {user?.role}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors w-fit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
