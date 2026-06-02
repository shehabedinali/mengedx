import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import busReducer from './slices/busSlice';
import driverReducer from './slices/driverSlice';
import routeReducer from './slices/routeSlice';
import tripReducer from './slices/tripSlice';
import bookingReducer from './slices/bookingSlice';
import dashboardReducer from './slices/dashboardSlice';
import staffReducer from './slices/staffSlice';
import toastReducer from './slices/toastSlice';
import notificationReducer from './slices/notificationSlice';
import seatMapReducer from './slices/seatMapSlice';
import companyReducer from './slices/companySlice';
import managersReducer from './slices/managersSlice';
import selectedCompanyReducer from './slices/selectedCompanySlice';
import tickerOfficeReducer from './slices/tickerOfficeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    buses: busReducer,
    drivers: driverReducer,
    routes: routeReducer,
    trips: tripReducer,
    bookings: bookingReducer,
    dashboard: dashboardReducer,
    staff: staffReducer,
    toast: toastReducer,
    notifications: notificationReducer,
    seatMaps: seatMapReducer,
    companies: companyReducer,
    managers: managersReducer,
    selectedCompany: selectedCompanyReducer,
    tickerOffices: tickerOfficeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
