import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/buses': 'Buses',
  '/drivers': 'Drivers',
  '/routes': 'Routes',
  '/trips': 'Trips',
  '/dispatch': 'Daily Dispatch',
  '/bookings': 'Bookings',
  '/staff': 'Staff',
  '/reports': 'Reports',
};

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? (pathname.startsWith('/buses/') ? 'Bus Detail' : 'Dashboard');
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Topbar title={title} />
      <main className="ml-56 pt-14 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
