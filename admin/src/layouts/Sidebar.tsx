import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

const superAdminNav = [
  { to: '/',          label: 'Dashboard',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { to: '/companies', label: 'Companies',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { to: '/managers',  label: 'Managers',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5"/><path d="M16 3.13a4 4 0 0 1 0 7.75M22 20c0-3-2.5-5.5-6-5.5"/></svg> },
  { to: '/buses',     label: 'Buses',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/><circle cx="7" cy="15" r="1" fill="currentColor"/><circle cx="17" cy="15" r="1" fill="currentColor"/></svg> },
  { to: '/drivers',   label: 'Drivers',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  { to: '/routes',    label: 'Routes',        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M3 12h18M3 6l4 6-4 6M21 6l-4 6 4 6"/></svg> },
  { to: '/trips',     label: 'Trips',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> },
  { to: '/bookings',  label: 'Bookings',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2"/><path d="M12 12v4M10 14h4"/></svg> },
  { to: '/seatmaps',  label: 'Seat Maps',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
  { to: '/staff',     label: 'Staff',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5"/><path d="M16 3.13a4 4 0 0 1 0 7.75M22 20c0-3-2.5-5.5-6-5.5"/></svg> },
  { to: '/reports',   label: 'Reports',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
];

const managerNav = [
  { to: '/',         label: 'Dashboard',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { to: '/buses',    label: 'Buses',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/><circle cx="7" cy="15" r="1" fill="currentColor"/><circle cx="17" cy="15" r="1" fill="currentColor"/></svg> },
  { to: '/drivers',  label: 'Drivers',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  { to: '/trips',    label: 'Trips',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> },
  { to: '/dispatch', label: 'Daily Dispatch', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { to: '/bookings', label: 'Bookings',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2"/><path d="M12 12v4M10 14h4"/></svg> },
  { to: '/staff',    label: 'Staff',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5"/><path d="M16 3.13a4 4 0 0 1 0 7.75M22 20c0-3-2.5-5.5-6-5.5"/></svg> },
  { to: '/reports',  label: 'Reports',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);

  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
  const navItems = isSuperAdmin ? superAdminNav : managerNav;
  const portalLabel = isSuperAdmin ? 'Super Admin' : 'Manager Portal';

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
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-gray-100 text-black font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
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
          <div className="min-w-0">
            <p className="text-xs text-gray-700 font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors w-fit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
