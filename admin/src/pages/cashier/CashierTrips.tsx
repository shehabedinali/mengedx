import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrips } from '@/store/slices/tripSlice';
import { resolveCompanyId } from '@/store/slices/tickerOfficeSlice';
import Card from '@/components/Card';

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

const STATUS_BAR: Record<string, string> = {
    Planned: 'bg-blue-400', Boarding: 'bg-purple-400', Departed: 'bg-indigo-400',
    InTransit: 'bg-orange-400', Completed: 'bg-green-400', Cancelled: 'bg-red-400', Delayed: 'bg-amber-400',
};

const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';

const toDateKey = (value: string) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const FILTERS = ['All', 'Bookable', 'Planned', 'Boarding', 'Delayed', 'Completed', 'Cancelled'];

export default function CashierTrips() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector(s => s.auth.user);
    const { data: trips, loading } = useAppSelector(s => s.trips);
    const companyId = resolveCompanyId(user?.company);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Bookable');
    const [routeFilter, setRouteFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        if (companyId) dispatch(fetchTrips({ company: companyId }));
    }, [dispatch, companyId]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        const selectedDate = dateFilter.trim();
        return trips.filter((t: any) => {
            const origin = (t.route?.origin ?? '').toLowerCase();
            const dest = (t.route?.destination ?? '').toLowerCase();
            const name = (t.route?.name ?? '').toLowerCase();
            const matchQ = !q || origin.includes(q) || dest.includes(q) || name.includes(q);
            const matchRoute = routeFilter === 'all' || String(t.route?._id ?? '') === routeFilter;
            const matchDate = !selectedDate || toDateKey(t.date) === selectedDate;

            let matchF = true;
            if (filter === 'Bookable') matchF = ACTIVE_STATUSES.includes(t.status) && (t.availableSeats ?? 0) > 0;
            else if (filter !== 'All') matchF = t.status === filter;

            return matchQ && matchF && matchRoute && matchDate;
        });
    }, [trips, search, filter, routeFilter, dateFilter]);

    const routeOptions = useMemo(() => {
        const seen = new Set<string>();
        return trips
            .map((t: any) => t.route)
            .filter((route: any) => {
                const id = String(route?._id ?? '');
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
            })
            .sort((a: any, b: any) => String(a?.name ?? a?.origin ?? '').localeCompare(String(b?.name ?? b?.origin ?? '')));
    }, [trips]);

    const bookable = trips.filter((t: any) => ACTIVE_STATUSES.includes(t.status) && (t.availableSeats ?? 0) > 0).length;
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayCount = trips.filter((t: any) => t.date && new Date(t.date).toISOString().slice(0, 10) === todayKey).length;

    return (
        <div className="flex flex-col gap-5">

            {/* stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Trips', value: trips.length, color: 'text-gray-900' },
                    { label: "Today's", value: todayCount, color: 'text-indigo-600' },
                    { label: 'Bookable Now', value: bookable, color: bookable > 0 ? 'text-green-600' : 'text-gray-400' },
                ].map(s => (
                    <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
                        <p className="text-xs text-gray-400">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </Card>
                ))}
            </div>

            {/* search */}
            <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                    type="text" placeholder="Search route…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                />
            </div>

            {/* route + date filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Route
                    </label>
                    <select
                        value={routeFilter}
                        onChange={e => setRouteFilter(e.target.value)}
                        title="Filter trips by route"
                        aria-label="Filter trips by route"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                    >
                        <option value="all">All routes</option>
                        {routeOptions.map((route: any) => (
                            <option key={route._id} value={route._id}>
                                {route.name ?? `${route.origin ?? '—'} → ${route.destination ?? '—'}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Date
                    </label>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        title="Filter trips by date"
                        aria-label="Filter trips by date"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-gray-400">
                    {routeFilter !== 'all' || dateFilter ? 'Filtered view' : 'Showing all trips'}
                </p>
                {(routeFilter !== 'all' || dateFilter) && (
                    <button
                        type="button"
                        onClick={() => {
                            setRouteFilter('all');
                            setDateFilter('');
                        }}
                        className="text-xs font-medium text-gray-500 hover:text-black transition-colors"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
                {FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
                        {f}
                    </button>
                ))}
            </div>

            <p className="text-xs text-gray-400">{filtered.length} trip{filtered.length !== 1 ? 's' : ''}</p>

            {/* trip list */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-200">
                        <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M7 18v2M17 18v2" />
                    </svg>
                    <p className="text-sm text-gray-400">No trips found.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map((trip: any) => {
                        const canBook = ACTIVE_STATUSES.includes(trip.status);
                        const avail = trip.availableSeats ?? 0;
                        const cap = trip.bus?.capacity ?? 0;
                        const occ = cap > 0 ? Math.round(((cap - avail) / cap) * 100) : 0;

                        return (
                            <div key={trip._id}
                                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all">
                                <div className={`h-1 ${STATUS_BAR[trip.status] ?? 'bg-gray-200'}`} />
                                <div className="p-4 flex flex-col gap-3">

                                    {/* header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-100" />
                                                <div className="w-px h-5 bg-gray-200" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {trip.route?.origin ?? '—'} → {trip.route?.destination ?? '—'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">{trip.route?.name ?? '—'}</p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {trip.status}
                                        </span>
                                    </div>

                                    {/* meta */}
                                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3">
                                                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                            </svg>
                                            {fmtDate(trip.date)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3">
                                                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                                            </svg>
                                            {trip.departureTime ?? '—'}
                                        </span>
                                        {trip.bus?.name && <span>{trip.bus.name}</span>}
                                        {trip.bus?.plateNumber && <span className="font-mono">{trip.bus.plateNumber}</span>}
                                    </div>

                                    {/* occupancy */}
                                    {cap > 0 && (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between text-[10px] text-gray-400">
                                                <span>{cap - avail} booked · <span className={avail > 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>{avail} available</span></span>
                                                <span>{occ}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${occ >= 90 ? 'w-[90%] bg-red-500' : occ >= 60 ? 'w-[60%] bg-orange-400' : 'w-[30%] bg-green-500'}`}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* action */}
                                    <div className="flex items-center justify-end pt-1 border-t border-gray-100">
                                        {canBook && avail > 0 ? (
                                            <button
                                                onClick={() => navigate(`/cashier/trips/${trip._id}/book`)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                                    <rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v4M10 14h4" />
                                                </svg>
                                                Book Seats
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-300 font-medium">
                                                {avail === 0 ? 'Full' : 'Not bookable'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
