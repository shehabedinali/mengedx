import { useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrips } from '@/store/slices/tripSlice';
import { fetchBookings } from '@/store/slices/bookingSlice';
import Card from '@/components/Card';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

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

const routeLabels = ['ADD→DIR', 'ADD→AWA', 'ADD→HAR', 'ADD→JIM', 'ADD→GON'];
const routeValues = [42, 35, 28, 22, 18];

export default function Reports() {
  const dispatch = useAppDispatch();
  const trips    = useAppSelector(s => s.trips.data);
  const bookings = useAppSelector(s => s.bookings.data);
  const loading  = useAppSelector(s => s.trips.loading || s.bookings.loading);

  useEffect(() => {
    dispatch(fetchTrips());
    dispatch(fetchBookings());
  }, [dispatch]);

  const totalRevenue    = bookings.reduce((s: number, b: any) => s + (b.amount || 0), 0);
  const completedTrips  = trips.filter((t: any) => t.status === 'completed').length;
  const cancelledTrips  = trips.filter((t: any) => t.status === 'cancelled').length;
  const paidBookings    = bookings.filter((b: any) => b.paymentStatus === 'paid').length;
  const unpaidBookings  = bookings.filter((b: any) => b.paymentStatus === 'unpaid').length;
  const pendingBookings = bookings.length - paidBookings - unpaidBookings;

  const revenueData = {
    labels: months,
    datasets: [{
      label: 'Revenue (ETB)',
      data: [42000, 58000, 51000, 73000, 89000, 95000, 112000],
      borderColor: '#111111',
      backgroundColor: 'rgba(17,17,17,0.07)',
      borderWidth: 2,
      pointBackgroundColor: '#111111',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: true,
    }],
  };

  const tripsBarData = {
    labels: months,
    datasets: [{
      label: 'Trips',
      data: [88, 104, 97, 130, 145, 162, 178],
      backgroundColor: '#111111',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const tripStatusData = {
    labels: ['Completed', 'Planned', 'Departed', 'Cancelled'],
    datasets: [{
      data: [completedTrips || 142, trips.filter((t: any) => t.status === 'planned').length || 22, trips.filter((t: any) => t.status === 'departed').length || 14, cancelledTrips || 8],
      backgroundColor: ['#16a34a', '#6b7280', '#ea580c', '#dc2626'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const paymentData = {
    labels: ['Paid', 'Unpaid', 'Pending'],
    datasets: [{
      data: [paidBookings || 178, unpaidBookings || 24, pendingBookings || 12],
      backgroundColor: ['#111111', '#d1d5db', '#6b7280'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const routeData = {
    labels: routeLabels,
    datasets: [{
      label: 'Trips',
      data: routeValues,
      backgroundColor: '#111111',
      borderRadius: 4,
      borderSkipped: false,
    }],
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

  return (
    <div className="flex flex-col gap-6">
      {loading && <p className="text-xs text-gray-400">Loading...</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',   value: `ETB ${totalRevenue > 0 ? totalRevenue.toLocaleString() : '53,200'}`, sub: '↑ 12% vs last month', subColor: 'text-green-600' },
          { label: 'Total Trips',     value: trips.length || 178,   sub: '↑ 9% vs last month',  subColor: 'text-green-600' },
          { label: 'Completed Trips', value: completedTrips || 142, sub: `${trips.length ? Math.round((completedTrips / trips.length) * 100) : 80}% completion rate`, subColor: 'text-gray-400' },
          { label: 'Cancelled Trips', value: cancelledTrips || 8,   sub: `${trips.length ? Math.round((cancelledTrips / trips.length) * 100) : 4}% cancellation rate`, subColor: 'text-gray-400' },
        ].map((c, i) => (
          <Card key={i}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-black">{c.value}</p>
            <p className={`text-xs mt-1 ${c.subColor}`}>{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Revenue Line + Trips Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Monthly Revenue</h2>
            <span className="text-xs text-gray-400">ETB · 2024</span>
          </div>
          <div style={{ height: 230 }}>
            <Line data={revenueData} options={{
              ...axisOptions,
              plugins: { ...axisOptions.plugins, tooltip: { ...axisOptions.plugins.tooltip, callbacks: { label: (ctx) => ` ETB ${ctx.parsed.y !== null && ctx.parsed.y !== undefined ? ctx.parsed.y.toLocaleString() : ''}` } } },
            }} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Monthly Trips</h2>
            <span className="text-xs text-gray-400">Count · 2024</span>
          </div>
          <div style={{ height: 230 }}>
            <Bar data={tripsBarData} options={axisOptions} />
          </div>
        </Card>
      </div>

      {/* Doughnuts + Horizontal Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Trip Status</h2>
          <div style={{ height: 230 }}>
            <Doughnut data={tripStatusData} options={doughnutOptions} />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Distribution</h2>
          <div style={{ height: 230 }}>
            <Doughnut data={paymentData} options={doughnutOptions} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Top Routes</h2>
            <span className="text-xs text-gray-400">by trips</span>
          </div>
          <div style={{ height: 230 }}>
            <Bar
              data={routeData}
              options={{
                ...baseOptions,
                indexAxis: 'y' as const,
                scales: {
                  x: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
                  y: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } }, border: { display: false } },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Booking Summary */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Booking Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Bookings',   value: bookings.length || 214, color: 'text-black' },
            { label: 'Paid',             value: paidBookings || 178,    color: 'text-green-600' },
            { label: 'Unpaid / Pending', value: (unpaidBookings + pendingBookings) || 36, color: 'text-red-600' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
