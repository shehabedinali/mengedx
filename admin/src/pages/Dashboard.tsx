import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardStats } from '@/store/slices/dashboardSlice';
import { fetchBookings } from '@/store/slices/bookingSlice';
import Card from '@/components/Card';
import Badge from '@/components/Badge';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#111',
      bodyColor: '#555',
      borderColor: '#e5e5e5',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
};

const axisOptions = {
  ...baseOptions,
  scales: {
    x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
    y: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
  },
};

const doughnutOptions = {
  ...baseOptions,
  cutout: '65%',
  plugins: {
    ...baseOptions.plugins,
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: { boxWidth: 10, padding: 12, color: '#6b7280', font: { size: 11 } },
    },
  },
};

function StatCard({
  label, value, icon, iconBg, trend, trendUp,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  iconBg: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1.5 font-medium ${trendUp ? 'text-green-600' : 'text-gray-400'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${iconBg}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { stats, loading } = useAppSelector(s => s.dashboard);
  const bookings = useAppSelector(s => s.bookings.data);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchBookings());
  }, [dispatch]);

  // KPI computations from bookings
  const totalBookings = bookings.length;
  const paidBookings = bookings.filter((b: any) => b.paymentStatus?.toLowerCase() === 'paid').length;
  const unpaidBookings = bookings.filter((b: any) => b.paymentStatus?.toLowerCase() === 'unpaid').length;
  const pendingBookings = bookings.filter((b: any) => b.paymentStatus?.toLowerCase() === 'pending').length;
  const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.paidAmount ?? b.totalAmount ?? 0), 0);

  // Occupancy line chart — use recentTrips that have bus data
  const tripsWithBus = (stats?.recentTrips ?? []).filter((t: any) => t.bus?.capacity);
  const occupancyData = tripsWithBus.map((t: any) => {
    const booked = Array.isArray(t.bookedSeats) ? t.bookedSeats.length : 0;
    return Math.round((booked / t.bus.capacity) * 100);
  });
  const occupancyLabels = tripsWithBus.map((t: any) =>
    t.route?.origin
      ? `${t.route.origin.slice(0, 3)}→${t.route.destination?.slice(0, 3)}`
      : t.route?.name?.slice(0, 6) ?? '—'
  );

  const barData = {
    labels: stats?.weekLabels ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Trips',
      data: stats?.weeklyTrips ?? [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(99,102,241,0.85)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const sc = stats?.statusCounts ?? {};
  const tripStatusDoughnut = {
    labels: ['Completed', 'Planned', 'In Transit', 'Cancelled', 'Delayed'],
    datasets: [{
      data: [
        sc.Completed ?? 0, sc.Planned ?? 0,
        (sc.InTransit ?? 0) + (sc.Boarding ?? 0) + (sc.Departed ?? 0),
        sc.Cancelled ?? 0, sc.Delayed ?? 0,
      ],
      backgroundColor: ['#16a34a', '#6b7280', '#ea580c', '#dc2626', '#d97706'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const paymentDoughnut = {
    labels: ['Paid', 'Unpaid', 'Pending'],
    datasets: [{
      data: [paidBookings, unpaidBookings, pendingBookings],
      backgroundColor: ['#16a34a', '#dc2626', '#d97706'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const occupancyLine = {
    labels: occupancyLabels.length ? occupancyLabels : ['—'],
    datasets: [{
      label: 'Occupancy %',
      data: occupancyData.length ? occupancyData : [0],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      borderWidth: 2,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: true,
    }],
  };

  const dash = (v: number | undefined) => loading ? '—' : (v ?? 0);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Trips"
          value={dash(stats?.todayTrips)}
          iconBg="bg-indigo-100"
          trend="Scheduled for today"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} className="w-5 h-5">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          }
        />
        <StatCard
          label="Active Buses"
          value={dash(stats?.activeBuses)}
          iconBg="bg-emerald-100"
          trend="Currently operational"
          trendUp
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={1.8} className="w-5 h-5">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M2 10h20M7 18v2M17 18v2" />
              <circle cx="7" cy="15" r="1" fill="#10b981" />
              <circle cx="17" cy="15" r="1" fill="#10b981" />
            </svg>
          }
        />
        <StatCard
          label="Active Drivers"
          value={dash(stats?.activeDrivers)}
          iconBg="bg-sky-100"
          trend="Available for dispatch"
          trendUp
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth={1.8} className="w-5 h-5">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          }
        />
        <StatCard
          label="Total Trips"
          value={dash(stats?.totalTrips)}
          iconBg="bg-amber-100"
          trend="All time"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={1.8} className="w-5 h-5">
              <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
            </svg>
          }
        />
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
          <p className="text-xs text-indigo-500 font-medium mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-indigo-700">{loading ? '—' : totalBookings}</p>
          <p className="text-xs text-gray-400 mt-1">All bookings in system</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium mb-1">Paid Bookings</p>
          <p className="text-3xl font-bold text-emerald-700">{loading ? '—' : paidBookings}</p>
          <p className="text-xs text-gray-400 mt-1">
            {totalBookings > 0 ? `${Math.round((paidBookings / totalBookings) * 100)}% payment rate` : 'No bookings yet'}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100">
          <p className="text-xs text-amber-600 font-medium mb-1">Revenue</p>
          <p className="text-3xl font-bold text-amber-700">
            {loading ? '—' : `ETB ${totalRevenue.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">From paid bookings</p>
        </Card>
      </div>

      {/* ── Weekly Bar + Trip Status Doughnut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Weekly Trips</h2>
            <span className="text-xs text-gray-400">Last 7 days</span>
          </div>
          <div style={{ height: 220 }}>
            <Bar data={barData} options={axisOptions} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Trip Status</h2>
            <span className="text-xs text-gray-400">All time</span>
          </div>
          <div style={{ height: 200 }}>
            <Doughnut data={tripStatusDoughnut} options={doughnutOptions} />
          </div>
        </Card>
      </div>

      {/* ── Payment Doughnut + Occupancy Line ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Payment Status</h2>
            <span className="text-xs text-gray-400">Bookings</span>
          </div>
          <div style={{ height: 200 }}>
            <Doughnut data={paymentDoughnut} options={doughnutOptions} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Occupancy Rate</h2>
            <span className="text-xs text-gray-400">Recent trips (%)</span>
          </div>
          <div style={{ height: 200 }}>
            <Line
              data={occupancyLine}
              options={{
                ...axisOptions,
                plugins: {
                  ...axisOptions.plugins,
                  tooltip: {
                    ...axisOptions.plugins.tooltip,
                    callbacks: { label: (ctx) => ` ${ctx.parsed.y}% occupancy` },
                  },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* ── Recent Trips ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Trips</h2>
          <button
            onClick={() => navigate('/trips')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            View all →
          </button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        ) : (stats?.recentTrips ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No trips found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Route', 'Bus', 'Date', 'Time', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.recentTrips ?? []).map((t: any) => (
                  <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">
                      {t.route?.origin ? `${t.route.origin} → ${t.route.destination}` : t.route?.name ?? '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">{t.bus?.plateNumber ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">{t.departureTime ?? '—'}</td>
                    <td className="py-2.5">
                      <Badge status={t.status ?? 'Planned'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Quick Actions ── */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: 'Schedule Trip', path: '/trips',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
              color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            },
            {
              label: 'Add Bus', path: '/buses',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M7 18v2M17 18v2" /></svg>,
              color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            },
            {
              label: 'Add Driver', path: '/drivers',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
              color: 'bg-sky-600 hover:bg-sky-700 text-white',
            },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${a.color}`}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      </Card>

    </div>
  );
}
