import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRoutes, createRoute } from '@/store/slices/routeSlice';
import { fetchCompanies } from '@/store/slices/companySlice';
import { setSelectedCompany } from '@/store/slices/selectedCompanySlice';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Card from '@/components/Card';

interface Stop { name: string; order: string; fareFromOrigin: string; }

const emptyForm = { name: '', origin: '', destination: '', distance: '', duration: '', status: 'Active' };
const emptyStop: Stop = { name: '', order: '', fareFromOrigin: '' };

const ROUTE_STATUSES = ['Active', 'Inactive'];

const MODE_COLORS: Record<string, string> = {
  Express: 'bg-blue-50 text-blue-700 border-blue-200',
  Local: 'bg-green-50 text-green-700 border-green-200',
  Night: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  VIP: 'bg-purple-50 text-purple-700 border-purple-200',
};

const fmtDuration = (min: number) => {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
};

function RouteCard({ route, onClick }: { route: any; onClick: () => void }) {
  const isActive = route.status === 'Active';

  return (
    <div onClick={onClick} className="group bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer">

      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-500">
              <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{route.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{route.totalTrips ?? 0} trips completed</p>
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {route.status}
        </span>
      </div>

      {/* origin → destination */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <div className="w-px h-6 bg-gray-200" />
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-800 leading-none">{route.origin}</p>
          <p className="text-xs font-semibold text-gray-800 leading-none">{route.destination}</p>
        </div>
      </div>

      {/* stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${MODE_COLORS[route.mode] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {route.mode ?? '—'}
        </span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
          {route.distance ?? '—'} km
        </span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
          {fmtDuration(route.duration)}
        </span>
      </div>

      {/* stops */}
      <div className="pt-1 border-t border-gray-100">
        {route.stops?.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{route.stops.length} Stop{route.stops.length > 1 ? 's' : ''}</p>
            <div className="flex flex-wrap gap-1">
              {route.stops
                .slice()
                .sort((a: any, b: any) => a.order - b.order)
                .map((s: any, i: number) => (
                  <span key={i} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {s.name} · {s.fareFromOrigin} ETB
                  </span>
                ))}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 italic">No stops</p>
        )}
      </div>
    </div>
  );
}

export default function Routes() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, loading, error } = useAppSelector(s => s.routes);
  const companies = useAppSelector((s: any) => s.companies.data);
  const selectedCompanyId = useAppSelector((s: any) => s.selectedCompany.companyId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [stops, setStops] = useState<Stop[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const user = useAppSelector(s => s.auth.user);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
  const isDispatcher = user?.role?.toLowerCase() === 'dispatcher';
  const companyFilter = isSuperAdmin ? (selectedCompanyId ?? undefined) : user?.company;

  useEffect(() => { if (isSuperAdmin) dispatch(fetchCompanies()); }, [dispatch, isSuperAdmin]);
  useEffect(() => { dispatch(fetchRoutes()); }, [dispatch]);  // routes are platform-wide

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const addStop = () => setStops(s => [...s, { ...emptyStop }]);
  const removeStop = (i: number) => setStops(s => s.filter((_, idx) => idx !== i));
  const setStop = (i: number, k: keyof Stop, v: string) =>
    setStops(s => s.map((st, idx) => idx === i ? { ...st, [k]: v } : st));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(createRoute({
      ...form,
      stops: stops.map(s => ({ name: s.name, order: Number(s.order), fareFromOrigin: Number(s.fareFromOrigin) })),
    }));
    setOpen(false);
    setForm(emptyForm);
    setStops([]);
  };

  const filtered = data.filter((r: any) => {
    const q = search.toLowerCase();
    const matchSearch = String(r.name ?? '').toLowerCase().includes(q) ||
      String(r.origin ?? '').toLowerCase().includes(q) ||
      String(r.destination ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active = data.filter((r: any) => r.status === 'Active').length;
  const inactive = data.filter((r: any) => r.status === 'Inactive').length;
  const totalTrips = data.reduce((sum: number, r: any) => sum + (r.totalTrips ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">

      {/* top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} routes total</p>
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
          {!isDispatcher && <Button onClick={() => setOpen(true)}>+ Create Route</Button>}
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Routes', value: data.length, color: 'text-gray-900' },
          { label: 'Active', value: active, color: 'text-green-600' },
          { label: 'Inactive', value: inactive, color: inactive > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Total Trips', value: totalTrips, color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* search */}
      <div className="relative max-w-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input type="text" placeholder="Search by name, origin or destination…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white" />
      </div>

      {/* route cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300">
            <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
          </svg>
          <p className="text-sm text-gray-400">No routes match your search.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
            {['All', ...ROUTE_STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={['px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  statusFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black',
                ].join(' ')}>
                {s}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((route: any) => (
              <RouteCard key={route._id} route={route} onClick={() => navigate(`/routes/${route._id}`)} />
            ))}
          </div>
        </>
      )}

      {/* Create Route Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create New Route" subtitle="Define the route path, mode and stops">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Route Info</p>
            <Input label="Route Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Addis - Dire Dawa Express" required />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Origin *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500" />
                  <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="e.g. Addis Ababa" required
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Destination *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
                  <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Dire Dawa" required
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Distance (km) *" type="number" min="0" value={form.distance} onChange={e => set('distance', e.target.value)} required />
              <Input label="Duration (min) *" type="number" min="0" value={form.duration} onChange={e => set('duration', e.target.value)} required />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
            <div className="flex gap-2">
              {ROUTE_STATUSES.map(s => (
                <button key={s} type="button" onClick={() => set('status', s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${form.status === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Stops</p>
              <button type="button" onClick={addStop}
                className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-gray-400 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path d="M12 5v14M5 12h14" /></svg>
                Add Stop
              </button>
            </div>
            {stops.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-2">No stops added yet.</p>
            )}
            {stops.map((stop, i) => (
              <div key={i} className="flex items-end gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex flex-col items-center gap-1 shrink-0 pb-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input label="Stop Name *" value={stop.name} onChange={e => setStop(i, 'name', e.target.value)} placeholder="e.g. Adama" required />
                  <Input label="Order *" type="number" min="0" value={stop.order} onChange={e => setStop(i, 'order', e.target.value)} placeholder="1" required />
                  <Input label="Fare (ETB) *" type="number" min="0" value={stop.fareFromOrigin} onChange={e => setStop(i, 'fareFromOrigin', e.target.value)} placeholder="150" required />
                </div>
                <button type="button" onClick={() => removeStop(i)}
                  className="shrink-0 w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors mb-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-red-500"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Create Route</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
