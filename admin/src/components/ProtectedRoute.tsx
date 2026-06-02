import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { restoreSession } from '@/store/slices/authSlice';
import { client, socket } from '@/store/feathers';

// Routes only SuperAdmin can access
const SUPER_ADMIN_ONLY = ['/companies', '/managers'];

// Routes Admin cannot access
const ADMIN_BLOCKED = ['/dispatch', '/routes', '/seatmaps'];

// Routes Dispatcher CAN access (read-only)
const DISPATCHER_ALLOWED = ['/', '/routes', '/trips', '/buses', '/drivers', '/dispatch'];

function getValidToken() {
  try {
    const token = localStorage.getItem('feathers-jwt');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now() ? payload : null;
  } catch { return null; }
}

export default function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);
  const [checking, setChecking] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    const payload = getValidToken();
    if (!payload) { setChecking(false); return; }

    const doAuth = () => {
      client.reAuthenticate()
        .then(async (result: any) => {
          const entity = result.user ?? result.users;
          if (entity?._id) {
            const fullUser = await client.service('users').get(entity._id).catch(() => entity);
            dispatch(restoreSession({
              _id: fullUser._id,
              name: fullUser.name,
              phone: fullUser.phone,
              role: fullUser.role,
              company: fullUser.company,
            }));
          }
        })
        .catch(() => { localStorage.removeItem('feathers-jwt'); })
        .finally(() => setChecking(false));
    };

    if (socket.connected) {
      doAuth();
    } else {
      socket.once('connect', doAuth);
      const t = setTimeout(() => { socket.off('connect', doAuth); setChecking(false); }, 5000);
      return () => { clearTimeout(t); socket.off('connect', doAuth); };
    }
  }, []);

  if (checking) return <div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toLowerCase() ?? '';
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isDispatcher = role === 'dispatcher';

  // Block non-superadmins from superadmin-only routes
  if (!isSuperAdmin && SUPER_ADMIN_ONLY.some(r => pathname.startsWith(r))) {
    return <Navigate to="/" replace />;
  }

  // Block admins from dispatch, routes, seatmaps
  if (isAdmin && ADMIN_BLOCKED.some(r => pathname.startsWith(r))) {
    return <Navigate to="/" replace />;
  }

  // Block managers from routes and seatmaps
  if (isManager && (pathname.startsWith('/routes') || pathname.startsWith('/seatmaps'))) {
    return <Navigate to="/" replace />;
  }

  // Dispatcher: only allowed on specific routes
  if (isDispatcher && !DISPATCHER_ALLOWED.some(r => r === '/' ? pathname === '/' : pathname.startsWith(r))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
