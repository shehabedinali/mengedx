import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, logout } from '@/store/slices/authSlice';
import { toast } from '@/store/slices/toastSlice';
import Button from '@/components/Button';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector(s => s.auth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setPhone(digits);
  };

  const fullPhone = `+251${phone}`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await dispatch(login({ phone: fullPhone, password }));
    if (login.fulfilled.match(result)) {
      const role = result.payload?.user?.role;
      const status = result.payload?.user?.status;

      if (role === 'Cashier') {
        if (!['Active', 'Assigned'].includes(status ?? '')) {
          dispatch(logout());
          dispatch(toast.error('Your cashier account is not active.'));
          return;
        }
        dispatch(toast.success('Welcome, ' + result.payload.user.name + '!'));
        navigate('/cashier');
        return;
      }

      if (!['SuperAdmin', 'Admin', 'Manager', 'Dispatcher'].includes(role)) {
        dispatch(logout());
        dispatch(toast.error('Access denied. Insufficient permissions.'));
        return;
      }
      dispatch(toast.success('Welcome back, ' + result.payload.user.name + '!'));
      navigate('/');
    } else {
      dispatch(toast.error((result.payload as string) ?? 'Login failed'));
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — dark brand ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden flex-col items-center justify-center p-12">
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white opacity-5 animate-pulse-slow" />
        <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-white opacity-5 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white opacity-5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-white opacity-5" />

        {/* Brand content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="animate-float mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-10 h-10">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M2 10h20M7 18v2M17 18v2" />
                <circle cx="7" cy="15" r="1" fill="white" />
                <circle cx="17" cy="15" r="1" fill="white" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">MengedX</h1>
          <p className="text-gray-400 text-base mb-10">Admin Portal — Manage your fleet with confidence</p>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            {[
              { icon: '🚌', title: 'Fleet Management', desc: 'Track every bus, route, and driver in real time' },
              { icon: '📡', title: 'Real-time Dispatch', desc: 'Monitor live trips and respond instantly' },
              { icon: '🎟️', title: 'Smart Booking', desc: 'Manage bookings, payments, and passengers' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left">
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold text-black">MengedX</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-gray-900">Sign in</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Phone field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Phone number</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent transition-all">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border-r border-gray-300 select-none">
                    <span className="text-base">🇪🇹</span>
                    <span className="text-sm font-medium text-gray-700">+251</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="912 345 678"
                    maxLength={9}
                    required
                    className="flex-1 px-3 py-2.5 text-sm outline-none bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 text-sm font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>

            <p className="text-xs text-gray-400 mt-5 text-center">
              Staff portal: SuperAdmin, Admin, Manager, Dispatcher · Cashier desk login supported
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
