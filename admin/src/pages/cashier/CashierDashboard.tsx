import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrips } from '@/store/slices/tripSlice';
import { fetchBookings } from '@/store/slices/bookingSlice';
import { resolveCompanyId } from '@/store/slices/tickerOfficeSlice';
import Card from '@/components/Card';
import Badge from '@/components/Badge';

const ACTIVE_STATUSES = ['Planned', 'Boarding', 'Delayed'];

const STATUS_COLORS: Record<string, string> = {
    Planned: 'bg-blue-50 text-blue-700 border-blue-200',
    Boarding: 'bg-purple-50 text-purple-700 border-purple-200',
    Departed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    InTransit: 'bg-orange-50 text-orange-700 border-orange-200',
    Completed: 'bg-green-50 text-green-700 border-green-200',
    Cancelled: 'bg-red-50 text-red-600 border-red-200',
    Delayed: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function CashierDashboard() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector(s => s.auth.user);
    const { data: trips, loading: tripsLoading } = useAppSelector(s => s.trips);
    const { data: bookings } = useAppSelector(s => s.bookings);
    const companyId = resolveCompanyId(user?.company);

    useEffect(() => {
        if (companyId) dispatch(fetchTrips({ company: companyId }));
    }, [dispatch, companyId]);

    useEffect(() => {
        dispatch(fetchBookings(undefined));
    }, [dispatch]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayTrips = trips.filter((t: any) => {
        if (!t.date) return false;
        return new Date(t.date).toISOString().slice(0, 10) === todayKey;
    });
    const bookableTrips = todayTrips.filter((t: any) => ACTIVE_STATUSES.includes(t.status));

    // Cashier's own bookings today
    const myBookingsToday = bookings.filter((b: any) => {
        const bookedById = typeof b.bookedBy === 'string' ? b.bookedBy : b.bookedBy?._id;
        const isMyBooking = bookedById === user?._id;
        const createdToday = b.createdAt && new Date(b.createdAt).toISOString().slice(0, 10) === todayKey;
        return isMyBooking && createdToday;
    });

    const myRevenue = myBookingsToday.reduce((s: number, b: any) => s + (b.paidAmount ?? 0), 0);
    const mySeats = myBookingsToday.reduce((s: number, b: any) => s + (b.seats?.length ?? 0), 0);

    return (
        <div className="flex flex-col gap-6">

            {/* welcome */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.name ?? 'Cashier'}</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/cashier/trips')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                        <rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" />
                    </svg>
                    New Booking
                </button>
            </div>

            {/* stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Today's Trips", value: todayTrips.length, color: 'text-gray-900' },
                    { label: 'Open for Booking', value: bookableTrips.length, color: bookableTrips.length > 0 ? 'text-green-600' : 'text-gray-400' },
                    { label: 'My Bookings Today', value: myBookingsToday.length, color: 'text-indigo-600' },
                    { label: 'Seats Sold Today', value: mySeats, color: mySeats > 0 ? 'text-orange-500' : 'text-gray-400' },
                ].map(s => (
                    <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
                        <p className="text-xs text-gray-400">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </Card>
                ))}
            </div>

            {/* revenue banner */}
            {myRevenue > 0 && (
                <div className="flex items-center gap-3 px-5 py-4 bg-gray-900 text-white rounded-2xl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-400 shrink-0">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <div>
                        <p className="text-xs text-gray-400">Revenue collected today</p>
                        <p className="text-lg font-bold">ETB {myRevenue.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* today's bookable trips */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Today's Trips
                    </p>
                    <button onClick={() => navigate('/cashier/trips')}
                        className="text-xs text-gray-500 hover:text-black transition-colors">
                        View all →
                    </button>
                </div>

                {tripsLoading ? (
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
                    </div>
                ) : todayTrips.length === 0 ? (
                    <Card>
                        <div className="flex flex-col items-center py-10 gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-200">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                            <p className="text-sm text-gray-400">No trips scheduled for today.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-2">
                        {todayTrips.map((trip: any) => {
                            const canBook = ACTIVE_STATUSES.includes(trip.status);
                            const avail = trip.availableSeats ?? 0;
                            return (
                                <div key={trip._id}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {trip.route?.origin ?? '—'} → {trip.route?.destination ?? '—'}
                                            </p>
                                            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                {trip.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {trip.departureTime ?? '—'} · {trip.bus?.name ?? '—'} · {avail} seats available
                                        </p>
                                    </div>
                                    {canBook && avail > 0 ? (
                                        <button
                                            onClick={() => navigate(`/cashier/trips/${trip._id}/book`)}
                                            className="shrink-0 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                                        >
                                            Book
                                        </button>
                                    ) : (
                                        <span className="shrink-0 text-xs text-gray-300 font-medium">
                                            {avail === 0 ? 'Full' : 'Closed'}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* recent bookings */}
            {myBookingsToday.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">My Bookings Today</p>
                        <button onClick={() => navigate('/cashier/bookings')} className="text-xs text-gray-500 hover:text-black transition-colors">View all →</button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {myBookingsToday.slice(0, 5).map((b: any) => (
                            <div key={b._id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {b.passengerName || b.phoneNumber || '—'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Seats: {(b.seats ?? []).join(', ') || '—'} · ETB {b.paidAmount ?? b.totalAmount ?? 0}
                                    </p>
                                </div>
                                <Badge status={b.paymentStatus ?? 'Unpaid'} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
