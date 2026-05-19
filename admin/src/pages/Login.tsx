import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { toast } from '@/store/slices/toastSlice';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector(s => s.auth);
  const [phone, setPhone] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setPhone(digits);
  };

  const fullPhone = `+251${phone}`;
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ phone: fullPhone, password }));
    if (login.fulfilled.match(result)) {
      const role = result.payload?.user?.role;
      if (role !== 'Manager' && role !== 'SuperAdmin') {
        dispatch(toast.error('Access denied. Insufficient permissions.'));
        return;
      }
      console.log(result);
      dispatch(toast.success('Welcome back, ' + result.payload.user.name + '!'));
      navigate('/');
    } else {
      dispatch(toast.error(result.payload as string ?? 'Login failed'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-black">MengedX</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal — Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <div className="flex border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-transparent">
              <span className="px-3 py-2 text-sm bg-gray-100 text-gray-600 border-r border-gray-300 select-none">+251</span>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="912345678"
                maxLength={9}
                required
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Sign in with your phone number and password
        </p>
      </div>
    </div>
  );
}
