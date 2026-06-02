import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBookings } from '@/store/slices/bookingSlice';
import Badge from '@/components/Badge';
import Card from '@/components/Card';

const PAYMENT_STATUSES = ['Paid', 'Unpaid', 'Pending'];
const BOOKING_STATUSES = ['Confirmed', 'Cancelled', 'Pending', 'checked-in'];

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function Bookings() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector(s => s.bookings);
  const user = useAppSelector(s => s.auth.user);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
  const companyFilter = isSuperAdmin ? undefined : user?.company;

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchBookings({ company: companyFilter }));
  }, [dispatch, companyFilter]);

  const filtered = data.filter((b: any) => {
    const q = search.toLowerCase();
    const matchSearch =
      (b.bookedBy?.name ?? b.user?.name ?? '').toLowerCase().includes(q) ||
      (b.phoneNumber ?? '').includes(q) ||
      (b.trip?.route?.name ?? '').toLowerCase().includes(q);
    const matchPayment = paymentFilter === 'All' || (b.paymentStatus ?? '').toLowerCase() === paymentFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || (b.status ?? '').toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchPayment && matchStatus;
  });

  const paid = data.filter((b: any) => (b.paymentStatus ?? '').toLowerCase() === 'paid').length;
  const unpaid = data.filter((b: any) => (b.paymentStatus ?? '').toLowerCase() === 'unpaid').length;
  const checkedIn = data.filter((b: any) => !!b.checkedInAt).length;
  const totalRev = data.reduce((s: number, b: any) => s + (b.paidAmount ?? b.totalAmount ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">

      {/* stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: data.length, color: 'text-gray-900' },
          { label: 'Paid', value: paid, color: 'text-green-600' },
          { label: 'Unpaid', value: unpaid, color: unpaid > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Checked In', value: checkedIn, color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* revenue banner */}
      {totalRev > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-900 text-white rounded-2xl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-400 shrink-0">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <div>
            <p className="text-xs text-gray-400">Total Revenue Collected</p>
            <p className="text-lg font-bold">ETB {totalRev.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone or route…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {['All', ...PAYMENT_STATUSES].map(s => (
            <button key={s} onClick={() => setPaymentFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${paymentFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {['All', ...BOOKING_STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => dispatch(fetchBookings({ company: companyFilter }))}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-all ml-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* results count */}
      <p className="text-xs text-gray-400">
        Showing {filtered.length} of {data.length} bookings
      </p>

      {/* booking cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-200">
            <rect x="2" y="7" width="20" height="13" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" />
            <path d="M12 12v4M10 14h4" />
          </svg>
          <p className="text-sm text-gray-400">No bookings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((b: any, i: number) => (
            <BookingCard key={b._id ?? i} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b }: { booking: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-gray-300 hover:shadow-sm transition-all animate-card-in">

      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {(b.bookedBy?.name ?? b.user?.name ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{b.bookedBy?.name ?? b.user?.name ?? '—'}</p>
            <p className="text-xs text-gray-400">{b.phoneNumber ?? '—'}</p>
          </div>
        </div>
        <Badge status={b.paymentStatus ?? 'Unpaid'} />
      </div>

      {/* route */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-400 shrink-0">
          <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
        </svg>
        <p className="text-xs font-semibold text-gray-700 truncate">
          {b.trip?.route?.name ?? b.trip?.route ?? '—'}
        </p>
      </div>

      {/* details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Seats</p>
          <p className="text-sm font-medium text-gray-800">{b.seats?.join(', ') ?? '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Method</p>
          <p className="text-sm font-medium text-gray-800">{b.paymentMethod ?? '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</p>
          <p className="text-sm font-medium text-gray-800">{b.totalAmount != null ? `ETB ${b.totalAmount}` : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Paid</p>
          <p className="text-sm font-medium text-gray-800">{b.paidAmount != null ? `ETB ${b.paidAmount}` : '—'}</p>
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Badge status={b.status ?? 'Pending'} />
        {b.checkedInAt ? (
          <span className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Checked in {new Date(b.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="text-[11px] text-gray-400">Not checked in</span>
        )}
      </div>
    </div>
  );
}
