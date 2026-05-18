import { createSlice } from '@reduxjs/toolkit';

type ToastType = 'success' | 'error' | 'info';

interface Toast { id: string; message: string; type: ToastType; }
interface ToastState { toasts: Toast[]; }

const toastSlice = createSlice({
  name: 'toast',
  initialState: { toasts: [] } as ToastState,
  reducers: {
    addToast(state, action: { payload: { message: string; type: ToastType } }) {
      state.toasts.push({ id: Date.now().toString(), ...action.payload });
    },
    removeToast(state, action: { payload: string }) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;

// helper thunk
export const toast = {
  success: (message: string) => addToast({ message, type: 'success' }),
  error: (message: string) => addToast({ message, type: 'error' }),
  info: (message: string) => addToast({ message, type: 'info' }),
};
