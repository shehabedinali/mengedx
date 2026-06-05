import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleLayout from '@/layouts/RoleLayout';
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
import SeatMaps from '@/pages/SeatMaps';
import Reports from '@/pages/Reports';
import TickerOffices from '@/pages/TickerOffices';
import TickerOfficeDetail from '@/pages/TickerOfficeDetail';
import CashierDashboard from '@/pages/cashier/CashierDashboard';
import CashierTrips from '@/pages/cashier/CashierTrips';
import CashierTripBook from '@/pages/cashier/CashierTripBook';
import CashierBookings from '@/pages/cashier/CashierBookings';
import Toaster from '@/components/Toaster';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleLayout />}>
              <Route path="/cashier" element={<CashierDashboard />} />
              <Route path="/cashier/trips" element={<CashierTrips />} />
              <Route path="/cashier/trips/:id/book" element={<CashierTripBook />} />
              <Route path="/cashier/bookings" element={<CashierBookings />} />
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
              <Route path="/seatmaps" element={<SeatMaps />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/ticker-offices" element={<TickerOffices />} />
              <Route path="/ticker-offices/:id" element={<TickerOfficeDetail />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </Provider>
  );
}
