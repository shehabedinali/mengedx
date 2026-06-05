import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBookings } from '@/store/slices/bookingSlice';
import Badge from '@/components/Badge';
import Card from '@/components/Card';

const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtTime = (d: string) =>
    d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function CashierBookings() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(s => s.auth.user);
    const { data, loading, error } = useAppSelector(s => s.bookings);

    const [search, setSearch] = useState('');
    const [paymentFilter, setPayment] = useState('All');
    const [statusFilter, setStatus] = useState('All');

    useEffect(() => {
        dispatch(fetchBookings({ bookedBy: user?._id }));
    }, [dispatch, user?._id]);

    const filtered = data.filter((b: any) => {
        const q = search.toLowerCase();
        const matchSearch =
            (b.passengerName ?? '').toLowerCase().includes(q) ||
            (b.phoneNumber ?? '').includes(q) ||
            (b.trip?.route?.name ?? '').toLowerCase().includes(q) ||
            (b.seats ?? []).some((s: string) => s.toLowerCase().includes(q));
        const matchPayment = paymentFilter === 'All' || (b.paymentStatus ?? '').toLowerCase() === paymentFilter.toLowerCase();
        const matchStatus = statusFilter === 'All' || (b.status ?? '').toLowerCase() === statusFilter.toLowerCase();
        return matchSearch && matchPayment && matchStatus;
    });

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayBookings = data.filter((b: any) => b.createdAt && new Date(b.createdAt).toISOString().slice(0, 10) === todayKey);
    const todayRevenue = todayBookings.reduce((s: number, b: any) => s + (b.paidAmount ?? 0), 0);
    const paidCount = data.filter((b: any) => (b.paymentStatus ?? '').toLowerCase() === 'paid').length;

    return (
        <div className="flex flex-col gap-5">

            {/* stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Bookings', value: data.length, color: 'text-gray-900' },
                    { label: "Today's Bookings", value: todayBookings.length, color: 'text-indigo-600' },
                    { label: 'Paid', value: paidCount, color: 'text-green-600' },
                    { label: "Today's Revenue", value: `ETB ${todayRevenue.toLocaleString()}`, color: todayRevenue > 0 ? 'text-orange-500' : 'text-gray-400' },
                ].map(s => (
                    <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
                        <p className="text-xs text-gray-400">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    </Card>
                ))}
            </div>

            {/* search + filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text" placeholder="Search by name, phone, seat…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                    />
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    {['All', 'Paid', 'Partial', 'Unpaid'].map(s => (
                        <button key={s} onClick={() => setPayment(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${paymentFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    {['All', 'Booked', 'Pending', 'Cancelled'].map(s => (
                        <button key={s} onClick={() => setStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                <button onClick={() => dispatch(fetchBookings({ bookedBy: user?._id }))}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-all ml-auto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-gray-400">Showing {filtered.length} of {data.length} bookings</p>

            {/* booking list */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-200">
                        <rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v4M10 14h4" />
                    </svg>
                    <p className="text-sm text-gray-400">No bookings found.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map((b: any) => (
                        <div key={b._id}
                            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-gray-300 hover:shadow-sm transition-all">

                            {/* header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {(b.passengerName || b.phoneNumber || 'P')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 leading-tight">
                                            {b.passengerName || '—'}
                                        </p>
                                        <p className="text-xs text-gray-400">{b.phoneNumber ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge status={b.paymentStatus ?? 'Unpaid'} />
                                    <Badge status={b.status ?? 'Pending'} />
                                </div>
                            </div>

                            {/* route */}
                            {b.trip?.route && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-400 shrink-0">
                                        <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
                                    </svg>
                                    <p className="text-xs font-semibold text-gray-700 truncate">
                                        {b.trip.route?.name ?? `${b.trip.route?.origin} → ${b.trip.route?.destination}`}
                                    </p>
                                </div>
                            )}

                            {/* details */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Seats</p>
                                    <p className="text-sm font-mono font-medium text-gray-800">{b.seats?.join(', ') ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Method</p>
                                    <p className="text-sm font-medium text-gray-800">{b.paymentMethod ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {b.totalAmount != null ? `ETB ${b.totalAmount.toLocaleString()}` : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Paid</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {b.paidAmount != null ? `ETB ${b.paidAmount.toLocaleString()}` : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-[11px] text-gray-400">{fmt(b.createdAt)} · {fmtTime(b.createdAt)}</span>
                                {b.checkedInAt ? (
                                    <span className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                        Checked in {fmtTime(b.checkedInAt)}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-gray-400">Not checked in</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
