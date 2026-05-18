import { createSlice } from '@reduxjs/toolkit';

export interface Alert {
  id: string;
  type: 'maintenance' | 'insurance' | 'license' | 'info';
  title: string;
  message: string;
  read: boolean;
}

const initialAlerts: Alert[] = [
  { id: '1', type: 'maintenance', title: 'Maintenance Due', message: '2 buses are due for maintenance this week.', read: false },
  { id: '2', type: 'insurance', title: 'Insurance Expiry', message: 'Bus AA-12345 insurance expires in 7 days.', read: false },
  { id: '3', type: 'license', title: 'Driver License Expiry', message: "Driver Abebe's license expires in 14 days.", read: false },
  { id: '4', type: 'info', title: 'New Booking', message: '5 new bookings received for tomorrow\'s trips.', read: false },
];

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { alerts: initialAlerts },
  reducers: {
    markRead(state, action: { payload: string }) {
      const a = state.alerts.find(a => a.id === action.payload);
      if (a) a.read = true;
    },
    markAllRead(state) {
      state.alerts.forEach(a => { a.read = true; });
    },
  },
});

export const { markRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
