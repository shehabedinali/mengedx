import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';
import { fetchTrips, createTrip, updateTripStatus, toggleBlockedDate } from '@/store/slices/tripSlice';
import { fetchBuses } from '@/store/slices/busSlice';
import { fetchRoutes } from '@/store/slices/routeSlice';
import { fetchCompanies } from '@/store/slices/companySlice';
import { setSelectedCompany } from '@/store/slices/selectedCompanySlice';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Card from '@/components/Card';
import { isDispatcherRole } from '@/constants/roles';

const TRIP_STATUSES = ['Planned', 'Boarding', 'Departed', 'InTransit', 'Completed', 'Cancelled', 'Delayed'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toKey = (d: Date) => d.toISOString().slice(0, 10);
const fmtDate = (key: string) =>
  new Date(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const empty = { route: '', bus: '', date: '', departureTime: '', status: 'Planned', company: '' };

const STATUS_COLORS: Record<string, string> = {
  Planned: 'bg-blue-50 text-blue-700 border-blue-200',
  Boarding: 'bg-purple-50 text-purple-700 border-purple-200',
  Departed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  InTransit: 'bg-orange-50 text-orange-700 border-orange-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
  Delayed: 'bg-amber-50 text-amber-700 border-amber-200',
};

const fmtDate2 = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function TripCard({ trip, dispatch, onNavigate, canEdit }: { trip: any; dispatch: any; onNavigate?: (id: string) => void; canEdit?: boolean }) {
  const route = trip.route;
  const bus = trip.bus;
  const capacity = bus?.capacity ?? 0;
  const booked = trip.bookedSeats?.length ?? 0;
  const available = capacity > 0 ? capacity - booked : capacity;
  const occupancy = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
  const fmtDur = (min: number) => { if (!min) return null; const h = Math.floor(min / 60); const m = min % 60; return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`; };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all">

      {/* top accent bar by status */}
      <div className={`h-1 w-full ${trip.status === 'Completed' ? 'bg-green-400' :
        trip.status === 'Cancelled' ? 'bg-red-400' :
          trip.status === 'InTransit' || trip.status === 'Departed' ? 'bg-orange-400' :
            trip.status === 'Boarding' ? 'bg-purple-400' :
              trip.status === 'Delayed' ? 'bg-amber-400' : 'bg-blue-400'
        }`} />

      <div className="p-4 flex flex-col gap-4">

        {/* header: route + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-100" />
              <div className="w-px h-5 bg-gray-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{route?.origin ?? '—'} → {route?.destination ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{route?.name ?? '—'}</p>
            </div>
          </div>
          <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {trip.status}
          </span>
        </div>

        {/* date + time + distance */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3 text-gray-400">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {fmtDate2(trip.date)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3 text-gray-400">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            {trip.departureTime ?? '—'}
          </span>
          {route?.distance && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-700">
              {route.distance} km
            </span>
          )}
          {route?.duration && (
            <span className="text-[11px] text-gray-400">{fmtDur(route.duration)}</span>
          )}
        </div>

        {/* bus info */}
        {bus && (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-500">
                <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M7 18v2M17 18v2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900">{bus.name}</p>
              <p className="text-[10px] text-gray-400 font-mono">{bus.plateNumber} · {capacity} seats</p>
            </div>
            {/* available seats */}
            <div className="flex flex-col items-end shrink-0">
              <p className="text-sm font-bold text-gray-900">{available}</p>
              <p className="text-[10px] text-gray-400">available</p>
            </div>
          </div>
        )}

        {/* seat occupancy bar */}
        {capacity > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Seat occupancy</span>
              <span className="font-semibold text-gray-600">{booked} / {capacity} booked ({occupancy}%)</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${occupancy >= 90 ? 'bg-red-500' : occupancy >= 60 ? 'bg-orange-400' : 'bg-green-500'
                }`} style={{ width: `${occupancy}%` }} />
            </div>
          </div>
        )}

        {/* stops */}
        {route?.stops?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {route.stops.slice().sort((a: any, b: any) => a.order - b.order).map((s: any, i: number) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">
                {s.name} · {s.fareFromOrigin} ETB
              </span>
            ))}
          </div>
        )}

        {/* footer: status update + view detail */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button onClick={() => onNavigate?.(trip._id)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
            View Details
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          {canEdit && (
            <select
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white hover:border-gray-400 transition-colors font-medium"
              value={trip.status}
              onChange={e => { e.stopPropagation(); dispatch(updateTripStatus({ id: trip._id, status: e.target.value })); }}
            >
              {TRIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
/* ─── Trip list with search + filter ─── */
function TripList({ trips, loading, dispatch, isSuperAdmin, companies, selectedCompanyId, onCompanyChange, canEdit }: {
  trips: any[]; loading: boolean; dispatch: any;
  isSuperAdmin?: boolean; companies?: any[]; selectedCompanyId?: string | null;
  onCompanyChange?: (id: string | null) => void;
  canEdit?: boolean;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return trips.filter(t => {
      const origin = (t.route?.origin ?? '').toLowerCase();
      const dest = (t.route?.destination ?? '').toLowerCase();
      const name = (t.route?.name ?? '').toLowerCase();
      const matchQ = !q || origin.includes(q) || dest.includes(q) || name.includes(q);
      const matchS = statusFilter === 'All' || t.status === statusFilter;
      return matchQ && matchS;
    });
  }, [trips, search, statusFilter]);

  return (
    <div className="flex flex-col gap-3">
      {/* company filter + search */}
      <div className="flex items-center gap-2">
        {isSuperAdmin && companies && (
          <select
            value={selectedCompanyId ?? ''}
            onChange={e => onCompanyChange?.(e.target.value || null)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
          >
            <option value="">All Companies</option>
            {companies.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search route…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
        </div>
      </div>
      {/* cards */}
      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No trips found.</p>
      ) : (
        <>
          <div className="flex items-center gap-1 flex-wrap bg-gray-100 p-1 rounded-xl self-start">
            {['All', ...TRIP_STATUSES].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                  }`}>{s}</button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {filtered.map((t: any) => <TripCard key={t._id} trip={t} dispatch={dispatch} onNavigate={(id) => navigate(`/trips/${id}`)} canEdit={canEdit} />)}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Schedule Trip Form ─── */
function TripForm({ form, set, buses, routes, blockedDates, onCancel, onSubmit, isSuperAdmin, companies }: any) {
  const selectedRoute = routes.find((r: any) => r._id === form.route);
  const selectedBus = buses.find((b: any) => b._id === form.bus);
  const isBlocked = form.date && blockedDates.includes(form.date);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">

      {/* live preview */}
      <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Trip Preview</p>
        {/* route row */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-400">
              <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
            </svg>
          </div>
          {selectedRoute ? (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{selectedRoute.name}</p>
              <p className="text-[10px] text-gray-400">{selectedRoute.origin} → {selectedRoute.destination} · {selectedRoute.distance} km</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No route selected</p>
          )}
        </div>
        {/* bus row */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 bg-white rounded-xl border border-gray-100">
            <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-gray-400">
                <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-gray-700 truncate">{selectedBus ? `${selectedBus.name} · ${selectedBus.plateNumber}` : <span className="text-gray-400 font-normal">No bus</span>}</p>
          </div>
        </div>
        {(form.date || form.departureTime) && (
          <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-white rounded-xl border border-gray-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-400 shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <p className="text-[11px] font-semibold text-gray-700">
              {form.date || '—'}
              {form.departureTime && <span className="text-gray-400"> · {form.departureTime}</span>}
            </p>
          </div>
        )}
      </div>

      {/* company selection */}
      {isSuperAdmin && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company *</p>
          <select value={form.company} onChange={e => set('company', e.target.value)} required
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white">
            <option value="">Select a Company</option>
            {companies.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* route */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Route *</p>
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
          {routes.map((r: any) => (
            <button key={r._id} type="button" onClick={() => set('route', r._id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${form.route === r._id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white hover:border-gray-300'
                }`}>
              <div className={`flex flex-col items-center gap-0.5 shrink-0`}>
                <div className={`w-1.5 h-1.5 rounded-full ${form.route === r._id ? 'bg-green-400' : 'bg-green-500'}`} />
                <div className={`w-px h-3 ${form.route === r._id ? 'bg-gray-600' : 'bg-gray-200'}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${form.route === r._id ? 'bg-red-400' : 'bg-red-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${form.route === r._id ? 'text-white' : 'text-gray-900'}`}>{r.name}</p>
                <p className={`text-[10px] truncate ${form.route === r._id ? 'text-gray-300' : 'text-gray-400'}`}>{r.origin} → {r.destination} · {r.distance} km</p>
              </div>
              {form.route === r._id && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4 shrink-0"><path d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
          {routes.length === 0 && <p className="text-xs text-gray-400 italic text-center py-3">No routes available.</p>}
        </div>
      </div>

      {/* bus only */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Bus *</p>
        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
          {buses.filter((b: any) => b.status === 'Active').map((b: any) => (
            <button key={b._id} type="button" onClick={() => set('bus', b._id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all ${form.bus === b._id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white hover:border-gray-300'
                }`}>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${form.bus === b._id ? 'bg-white/15' : 'bg-gray-100'
                }`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-3.5 h-3.5 ${form.bus === b._id ? 'text-white' : 'text-gray-500'}`}>
                  <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold truncate ${form.bus === b._id ? 'text-white' : 'text-gray-900'}`}>{b.name}</p>
                <p className={`text-[10px] font-mono truncate ${form.bus === b._id ? 'text-gray-300' : 'text-gray-400'}`}>{b.plateNumber}</p>
              </div>
            </button>
          ))}
          {buses.filter((b: any) => b.status === 'Active').length === 0 && <p className="text-xs text-gray-400 italic text-center py-3">No active buses.</p>}
        </div>
      </div>

      {/* schedule */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Schedule</p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Trip Date *</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Departure Time *</label>
          <input type="time" value={form.departureTime} onChange={e => set('departureTime', e.target.value)} required
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
        </div>
        {isBlocked && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            This date is blocked. Unblock it first or choose another date.
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isBlocked || !form.route || !form.bus}
          className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Schedule Trip
        </button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function Trips() {
  const dispatch = useAppDispatch();
  const { data, loading, error, blockedDates } = useAppSelector(s => s.trips);
  const buses = useAppSelector(s => s.buses.data);
  const routes = useAppSelector(s => s.routes.data);
  const companies = useAppSelector((s: any) => s.companies.data);
  const selectedCompanyId = useAppSelector((s: any) => s.selectedCompany.companyId);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [view, setView] = useState<'calendar' | 'list' | 'detail'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const user = useAppSelector(s => s.auth.user);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
  const isDispatcher = isDispatcherRole(user?.role);
  const companyFilter = isSuperAdmin ? (selectedCompanyId ?? undefined) : user?.company;

  useEffect(() => { if (isSuperAdmin) dispatch(fetchCompanies()); }, [dispatch, isSuperAdmin]);
  useEffect(() => {
    dispatch(fetchTrips({ company: companyFilter }));
    dispatch(fetchBuses({ company: companyFilter }));
    dispatch(fetchRoutes());   // routes are platform-wide, no company filter
  }, [dispatch, companyFilter]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const goToDay = (dateKey: string) => {
    if (dateKey < toKey(today)) return;
    if (!isDispatcher && blockedDates.includes(dateKey)) { dispatch(toggleBlockedDate(dateKey)); return; }
    if (isDispatcher && blockedDates.includes(dateKey)) return; // dispatchers can't unblock
    setSelectedDate(dateKey);
    setAnimating(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setView('detail')));
  };

  const goBack = () => {
    setView('calendar');
    setTimeout(() => { setSelectedDate(null); setAnimating(false); }, 350);
  };

  const goToList = () => {
    setAnimating(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setView('list')));
  };

  const backFromList = () => {
    setView('calendar');
    setTimeout(() => setAnimating(false), 350);
  };

  const handleBlockDay = (dateKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDispatcher) return; // dispatchers cannot block days
    if (dateKey < toKey(today)) return;
    dispatch(toggleBlockedDate(dateKey));
  };

  const openCreate = (date?: string) => {
    setForm({ ...empty, date: date ?? selectedDate ?? '' });
    setCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBus = buses.find((b: any) => b._id === form.bus);
    await dispatch(createTrip({ ...form, availableSeats: selectedBus?.capacity ?? 0 }));
    setCreateOpen(false);
    setForm(empty);
  };

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const tripsOnDay = (dateKey: string) =>
    data.filter((t: any) => t.date && new Date(t.date).toISOString().slice(0, 10) === dateKey);

  const dayTrips = selectedDate ? tripsOnDay(selectedDate) : [];
  const isBlocked = selectedDate ? blockedDates.includes(selectedDate) : false;

  const totalTrips = data.length;
  const planned = data.filter((t: any) => t.status === 'Planned').length;
  const inTransit = data.filter((t: any) => ['Boarding', 'Departed', 'InTransit'].includes(t.status)).length;
  const completed = data.filter((t: any) => t.status === 'Completed').length;
  const cancelled = data.filter((t: any) => t.status === 'Cancelled').length;

  return (
    <div className="relative overflow-hidden">
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Trips', value: totalTrips, color: 'text-gray-900' },
          { label: 'Planned', value: planned, color: 'text-blue-600' },
          { label: 'In Transit', value: inTransit, color: 'text-orange-500' },
          { label: 'Completed', value: completed, color: 'text-green-600' },
          { label: 'Cancelled', value: cancelled, color: cancelled > 0 ? 'text-red-600' : 'text-gray-900' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ══ SLIDE WRAPPER ══ */}
      <div
        className="flex transition-transform duration-350 ease-in-out"
        style={{
          width: '300%',
          transform: view === 'detail' ? 'translateX(-66.666%)' : view === 'list' ? 'translateX(-33.333%)' : 'translateX(0)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >

        {/* ══ PANEL 1 — Calendar ══ */}
        <div className="w-1/3 flex flex-col gap-6 pr-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{data.length} trips total</p>
            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <select
                  value={selectedCompanyId ?? ''}
                  onChange={e => dispatch(setSelectedCompany(e.target.value || null))}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
                >
                  <option value="">All Companies</option>
                  {companies.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              )}
              <button
                onClick={goToList}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                View All Trips
              </button>
              <p className="text-xs text-gray-400 italic">Click day · Right-click to block</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Calendar */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-black">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <h2 className="text-sm font-semibold text-gray-900">{MONTHS[calMonth]} {calYear}</h2>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-black">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-black inline-block" /><span>Has trips</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" /><span>Blocked</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-50 border border-blue-200 inline-block" /><span>Today</span></span>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateKey === toKey(today);
                const isPast = dateKey < toKey(today);
                const isBl = blockedDates.includes(dateKey);
                const cellTrips = tripsOnDay(dateKey);
                const hasTrips = cellTrips.length > 0;

                return (
                  <div
                    key={dateKey}
                    onClick={() => goToDay(dateKey)}
                    onContextMenu={e => { e.preventDefault(); handleBlockDay(dateKey, e as any); }}
                    className={[
                      'relative min-h-20 p-1.5 rounded-lg border transition-all select-none',
                      isPast ? 'opacity-40 cursor-not-allowed bg-gray-50 border-transparent' : 'cursor-pointer',
                      isBl && !isPast ? 'bg-red-50 border-red-200 hover:bg-red-100' : '',
                      isToday && !isBl ? 'bg-blue-50 border-blue-200' : '',
                      !isPast && !isBl && !isToday ? 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm' : '',
                    ].join(' ')}
                  >
                    <div className={['text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full', isToday ? 'bg-black text-white' : isBl ? 'text-red-500' : 'text-gray-700'].join(' ')}>
                      {day}
                    </div>
                    {isBl && <p className="text-xs text-red-400 font-medium">Blocked</p>}
                    {hasTrips && !isBl && (
                      <div className="flex flex-col gap-0.5">
                        {cellTrips.slice(0, 2).map((t: any, ti: number) => (
                          <div key={ti} className="text-xs bg-black text-white rounded px-1 py-0.5 truncate leading-tight">
                            {t.route?.origin?.slice(0, 3) ?? '—'} · {t.departureTime ?? ''}
                          </div>
                        ))}
                        {cellTrips.length > 2 && <p className="text-xs text-gray-400">+{cellTrips.length - 2} more</p>}
                      </div>
                    )}
                    {!isPast && !isBl && !hasTrips && (
                      <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-400">+ Schedule</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>


        </div>

        {/* ══ PANEL 2 — All Trips List ══ */}
        <div className="w-1/3 flex flex-col gap-5 px-3">
          {(animating || view === 'list') && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={backFromList}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
                    Back to Calendar
                  </button>
                  <span className="text-gray-300">|</span>
                  <h2 className="text-sm font-semibold text-gray-900">All Trips</h2>
                </div>
              </div>
              <Card className="p-0">
                <TripList trips={data} loading={loading} dispatch={dispatch}
                  isSuperAdmin={isSuperAdmin} companies={companies}
                  selectedCompanyId={selectedCompanyId}
                  onCompanyChange={id => dispatch(setSelectedCompany(id))}
                  canEdit={!isDispatcher} />
              </Card>
            </>
          )}
        </div>

        {/* ══ PANEL 3 — Day Detail ══ */}
        <div className="w-1/3 flex flex-col gap-5 pl-3">
          {(animating || view === 'detail') && selectedDate && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
                    Back to Calendar
                  </button>
                  <span className="text-gray-300">|</span>
                  <h2 className="text-sm font-semibold text-gray-900">{fmtDate(selectedDate)}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {!isDispatcher && (isBlocked ? (
                    <>
                      <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>
                        Blocked
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => dispatch(toggleBlockedDate(selectedDate))}>Unblock</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => dispatch(toggleBlockedDate(selectedDate))}>Block Day</Button>
                  ))}
                  {isDispatcher && isBlocked && (
                    <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>
                      Blocked
                    </span>
                  )}
                </div>
              </div>

              {/* Trip list card */}
              <Card className="p-0">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Scheduled Trips</p>
                    <p className="text-xs text-gray-400 mt-0.5">{dayTrips.length} trip{dayTrips.length !== 1 ? 's' : ''} on this day</p>
                  </div>
                  {!isBlocked && !isDispatcher && <Button onClick={() => openCreate(selectedDate)}>+ Add Trip</Button>}
                </div>

                {isBlocked ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-red-300">
                      <circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" />
                    </svg>
                    <p className="text-sm font-medium text-gray-500">This day is blocked</p>
                    <p className="text-xs text-gray-400">Unblock the day to schedule trips.</p>
                    {!isDispatcher && (
                      <Button size="sm" variant="secondary" onClick={() => dispatch(toggleBlockedDate(selectedDate))}>Unblock Day</Button>
                    )}
                  </div>
                ) : (
                  <TripList trips={dayTrips} loading={loading} dispatch={dispatch} canEdit={!isDispatcher} />
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Create Trip Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Schedule Trip" subtitle={selectedDate ? `For ${fmtDate(selectedDate)}` : 'Pick a date and assign resources'}>
        <TripForm form={form} set={set} buses={buses} routes={routes} blockedDates={blockedDates} onCancel={() => setCreateOpen(false)} onSubmit={handleSubmit} isSuperAdmin={isSuperAdmin} companies={companies} />
      </Modal>
    </div>
  );
}
