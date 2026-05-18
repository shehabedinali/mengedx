import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeToast } from '@/store/slices/toastSlice';

const styles = {
  success: 'bg-black text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-700 text-white',
};

const icons = { success: '✓', error: '✕', info: 'ℹ' };

export default function Toaster() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(s => s.toast.toasts);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[100] items-center">
      {toasts.map(t => (
        <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} onDismiss={() => dispatch(removeToast(t.id))} />
      ))}
    </div>
  );
}

function ToastItem({ id, message, type, onDismiss }: { id: string; message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(id)), 3500);
    return () => clearTimeout(timer);
  }, [id, dispatch]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm min-w-64 max-w-sm animate-fade-in ${styles[type]}`}>
      <span className="font-bold text-base">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100 text-base leading-none ml-1">&times;</button>
    </div>
  );
}
