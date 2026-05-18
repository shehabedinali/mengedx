import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { markRead, markAllRead } from '@/store/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface Props { title: string; }

const alertIcon = (type: string) => {
  if (type === 'maintenance') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-orange-500 shrink-0">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
  if (type === 'insurance') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-red-500 shrink-0">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
  if (type === 'license') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-yellow-500 shrink-0">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M16 14h2M7 10h5M7 14h3"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-blue-500 shrink-0">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
    </svg>
  );
};

export default function Topbar({ title }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);
  const alerts = useAppSelector(s => s.notifications.alerts);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';

  const [notifOpen, setNotifOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const unread = alerts.filter(a => !a.read).length;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-56 right-0 z-30">
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors relative"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">Notifications</span>
                  {unread > 0 && (
                    <button
                      onClick={() => dispatch(markAllRead())}
                      className="text-xs text-gray-400 hover:text-black transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {alerts.length === 0 && (
                    <p className="px-4 py-6 text-xs text-gray-400 text-center">No notifications</p>
                  )}
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => dispatch(markRead(alert.id))}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!alert.read ? 'bg-gray-50/80' : ''}`}
                    >
                      {alertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${alert.read ? 'text-gray-500' : 'text-gray-900'}`}>{alert.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{alert.message}</p>
                      </div>
                      {!alert.read && <span className="w-1.5 h-1.5 bg-black rounded-full mt-1.5 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              {(user?.name || user?.email || 'M')[0].toUpperCase()}
            </div>
            <span className="text-xs text-gray-600 hidden sm:block">{user?.name || 'Manager'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-gray-400">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <p className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100 truncate">{user?.email}</p>
                <button
                  onClick={() => { dispatch(logout()); navigate('/login'); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-black flex items-center gap-2 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
