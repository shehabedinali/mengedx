import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRoutes, updateRoute } from '@/store/slices/routeSlice';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';

const ROUTE_STATUSES = ['Active', 'Inactive'];

const fmtDuration = (min: number) => {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

interface Stop { name: string; order: string; fareFromOrigin: string; }

export default function RouteDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector(s => s.routes);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm]         = useState<any>(null);
  const [stops, setStops]       = useState<Stop[]>([]);

  useEffect(() => { if (!data.length) dispatch(fetchRoutes()); }, [dispatch, data.length]);

  const route = data.find((r: any) => r._id === id);

  useEffect(() => {
    if (route) {
      setForm({
        name: route.name ?? '',
        origin: route.origin ?? '',
        destination: route.destination ?? '',
        distance: String(route.distance ?? ''),
        duration: String(route.duration ?? ''),
        status: route.status ?? 'Active',
      });
      setStops(
        (route.stops ?? [])
          .slice()
          .sort((a: any, b: any) => a.order - b.order)
          .map((s: any) => ({ name: s.name, order: String(s.order), fareFromOrigin: String(s.fareFromOrigin) }))
      );
    }
  }, [route]);

  const set        = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const addStop    = () => setStops(s => [...s, { name: '', order: '', fareFromOrigin: '' }]);
  const removeStop = (i: number) => setStops(s => s.filter((_, idx) => idx !== i));
  const setStop    = (i: number, k: keyof Stop, v: string) =>
    setStops(s => s.map((st, idx) => idx === i ? { ...st, [k]: v } : st));

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(updateRoute({
      id: id!,
      data: {
        ...form,
        stops: stops.map(s => ({ name: s.name, order: Number(s.order), fareFromOrigin: Number(s.fareFromOrigin) })),
      },
    }));
    setEditOpen(false);
  };

  if (loading && !route) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl">
        <div className="h-7 w-40 skeleton rounded-lg" />
        <div className="h-40 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-gray-400 text-sm">Route not found.</p>
        <Button variant="secondary" onClick={() => navigate('/routes')}>← Back to Routes</Button>
      </div>
    );
  }

  const sortedStops = (route.stops ?? []).slice().sort((a: any, b: any) => a.order - b.order);
  const isActive    = route.status === 'Active';

  return (
    <div className="flex flex-col gap-5 max-w-2xl animate-fade-in">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/routes')} className="text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
          Routes
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{route.name}</span>
      </div>

      {/* hero card */}
      <Card className="flex flex-col gap-0 p-0 overflow-hidden">
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-gray-500">
                <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{route.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {route.status}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={() => setEditOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 mr-1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </Button>
        </div>

        {/* origin → destination banner */}
        <div className="mx-5 mb-5 flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200" />
            <div className="w-px h-8 bg-gray-300 border-dashed" />
            <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200" />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <p className="text-sm font-bold text-gray-900">{route.origin}</p>
            <p className="text-sm font-bold text-gray-900">{route.destination}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right shrink-0">
            <span className="text-xs text-gray-400">Distance</span>
            <span className="text-sm font-bold text-gray-900">{route.distance} km</span>
          </div>
        </div>
      </Card>

      {/* stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Duration',     value: fmtDuration(route.duration) },
          { label: 'Total Trips',  value: route.totalTrips ?? 0 },
          { label: 'Total Stops',  value: sortedStops.length },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* stops timeline */}
      <Card>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Route Timeline</p>
        <div className="flex flex-col">

          {/* origin */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-4 h-4 rounded-full bg-green-500 ring-2 ring-green-200 mt-0.5" />
              {sortedStops.length > 0 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[2rem]" />}
            </div>
            <div className="pb-4 flex-1">
              <p className="text-sm font-bold text-gray-900">{route.origin}</p>
              <p className="text-xs text-gray-400">Origin · 0 ETB</p>
            </div>
          </div>

          {/* stops */}
          {sortedStops.map((stop: any, i: number) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-400 mt-0.5" />
                <div className="w-px flex-1 bg-gray-200 my-1 min-h-[2rem]" />
              </div>
              <div className="pb-4 flex-1 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{stop.name}</p>
                  <p className="text-xs text-gray-400">Stop {stop.order}</p>
                </div>
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {stop.fareFromOrigin} ETB
                </span>
              </div>
            </div>
          ))}

          {/* destination */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-4 h-4 rounded-full bg-red-500 ring-2 ring-red-200 mt-0.5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{route.destination}</p>
              <p className="text-xs text-gray-400">Destination</p>
            </div>
          </div>

          {sortedStops.length === 0 && (
            <p className="text-xs text-gray-400 italic mt-2 ml-8">No intermediate stops.</p>
          )}
        </div>
      </Card>

      {/* extra info */}
      <Card>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Details</p>
        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
          <Field label="Distance">{route.distance} km</Field>
          <Field label="Duration">{fmtDuration(route.duration)}</Field>
          <Field label="Status">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {route.status}
            </span>
          </Field>
          <Field label="Total Trips">{route.totalTrips ?? 0}</Field>
        </div>
      </Card>

      {/* Edit Modal */}
      {form && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Route" subtitle="Update the route path and stops">
          <form onSubmit={handleEdit} className="flex flex-col gap-5">

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
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      form.status === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path d="M12 5v14M5 12h14"/></svg>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-red-500"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
