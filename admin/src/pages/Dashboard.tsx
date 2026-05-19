import { useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardStats } from '@/store/slices/dashboardSlice';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Table from '@/components/Table';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const statCards = [
  { key: 'todayTrips',    label: "Today's Trips",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-400"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> },
  { key: 'activeBuses',  label: 'Active Buses',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-400"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/><circle cx="7" cy="15" r="1" fill="currentColor"/><circle cx="17" cy="15" r="1" fill="currentColor"/></svg> },
  { key: 'activeDrivers',label: 'Active Drivers',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-400"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  { key: 'totalTrips',   label: 'Total Trips',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-400"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg> },
];

const recentTripCols = [
  { key: 'route', label: 'Route', render: (r: any) => r.route?.origin ? `${r.route.origin} → ${r.route.destination}` : r.route?.name ?? '—' },
  { key: 'bus',   label: 'Bus',   render: (r: any) => r.bus?.plateNumber ?? r.bus ?? '—' },
  { key: 'date',  label: 'Date',  render: (r: any) => r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
  { key: 'departureTime', label: 'Time' },
  { key: 'status', label: 'Status', render: (r: any) => <Badge status={r.status ?? 'Planned'} /> },
];



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

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector(s => s.dashboard);

  useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);

  const barData = {
    labels: stats?.weekLabels ?? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [{
      label: 'Trips',
      data: stats?.weeklyTrips ?? [0,0,0,0,0,0,0],
      backgroundColor: '#111111',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const sc = stats?.statusCounts ?? {};
  const doughnutData = {
    labels: ['Completed','Planned','InTransit','Cancelled','Delayed'],
    datasets: [{
      data: [
        sc.Completed ?? 0, sc.Planned ?? 0,
        (sc.InTransit ?? 0) + (sc.Boarding ?? 0) + (sc.Departed ?? 0),
        sc.Cancelled ?? 0, sc.Delayed ?? 0,
      ],
      backgroundColor: ['#16a34a','#6b7280','#ea580c','#dc2626','#d97706'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.key}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-black">
                  {loading ? '—' : `${(card as any).prefix ?? ''}${stats?.[card.key] ?? 0}`}
                </p>
              </div>
              {card.icon}
            </div>
          </Card>
        ))}
      </div>

      {/* Bar + Doughnut */}
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
          <div style={{ height: 180 }}>
            <Doughnut
              data={doughnutData}
              options={{
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
              }}
            />
          </div>
        </Card>
      </div>

      {/* Recent Trips */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Trips</h2>
        <Table columns={recentTripCols} data={stats?.recentTrips ?? []} loading={loading} emptyMessage="No trips found" />
      </Card>

    </div>
  );
}
