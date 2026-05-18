import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { restoreSession } from '@/store/slices/authSlice';
import { client, socket } from '@/store/feathers';

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
      // fallback if socket never connects
      const t = setTimeout(() => { socket.off('connect', doAuth); setChecking(false); }, 5000);
      return () => { clearTimeout(t); socket.off('connect', doAuth); };
    }
  }, []);

  if (checking) return <div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
