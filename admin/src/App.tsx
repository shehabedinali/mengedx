import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Buses from '@/pages/Buses';
import BusDetail from '@/pages/BusDetail';
import Drivers from '@/pages/Drivers';
import DriverDetail from '@/pages/DriverDetail';
import Routes_ from '@/pages/Routes';
import RouteDetail from '@/pages/RouteDetail';
import Trips from '@/pages/Trips';
import TripDetail from '@/pages/TripDetail';
import Dispatch from '@/pages/Dispatch';
import Bookings from '@/pages/Bookings';
import Staff from '@/pages/Staff';
import StaffDetail from '@/pages/StaffDetail';
import Companies from '@/pages/Companies';
import CompanyDetail from '@/pages/CompanyDetail';
import SuperAdminManagers from '@/pages/SuperAdminManagers';
import ManagerDetail from '@/pages/ManagerDetail';
import SeatMaps from '@/pages/SeatMaps';
import Reports from '@/pages/Reports';
import Toaster from '@/components/Toaster';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/buses" element={<Buses />} />
              <Route path="/buses/:id" element={<BusDetail />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/drivers/:id" element={<DriverDetail />} />
              <Route path="/routes" element={<Routes_ />} />
              <Route path="/routes/:id" element={<RouteDetail />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/trips/:id" element={<TripDetail />} />
              <Route path="/dispatch" element={<Dispatch />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/:id" element={<StaffDetail />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
              <Route path="/managers" element={<SuperAdminManagers />} />
              <Route path="/managers/:id" element={<ManagerDetail />} />
              <Route path="/seatmaps" element={<SeatMaps />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </Provider>
  );
}
