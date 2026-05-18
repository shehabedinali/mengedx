import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBookings } from '@/store/slices/bookingSlice';
import Table from '@/components/Table';
import Badge from '@/components/Badge';
import Card from '@/components/Card';

export default function Bookings() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector(s => s.bookings);

  useEffect(() => { dispatch(fetchBookings()); }, [dispatch]);

  const columns = [
    { key: 'bookedBy',      label: 'Booked By',   render: (r: any) => r.bookedBy?.name ?? r.user?.name ?? '—' },
    { key: 'phoneNumber',   label: 'Phone',        render: (r: any) => r.phoneNumber ?? '—' },
    { key: 'trip',          label: 'Trip',         render: (r: any) => r.trip?.route?.name ?? r.trip?.route ?? '—' },
    { key: 'seats',         label: 'Seats',        render: (r: any) => r.seats?.join(', ') ?? '—' },
    { key: 'totalAmount',   label: 'Total',        render: (r: any) => r.totalAmount != null ? `ETB ${r.totalAmount}` : '—' },
    { key: 'paidAmount',    label: 'Paid',         render: (r: any) => r.paidAmount != null ? `ETB ${r.paidAmount}` : '—' },
    { key: 'paymentStatus', label: 'Payment',      render: (r: any) => <Badge status={r.paymentStatus ?? 'Unpaid'} /> },
    { key: 'paymentMethod', label: 'Method',       render: (r: any) => r.paymentMethod ?? '—' },
    { key: 'status',        label: 'Booking',      render: (r: any) => <Badge status={r.status ?? 'Pending'} /> },
    {
      key: 'checkedInAt', label: 'Check-in',
      render: (r: any) => r.checkedInAt
        ? <span className="text-green-600 text-xs font-medium">✓ {new Date(r.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        : <span className="text-gray-400 text-xs">—</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} bookings total</p>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Card className="p-0">
        <Table columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
