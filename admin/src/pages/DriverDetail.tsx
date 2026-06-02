import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDrivers, updateDriver, deleteDriver } from '@/store/slices/driverSlice';
import { client } from '@/store/feathers';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Input from '@/components/Input';

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const isExpired = (d: string) => !!(d && new Date(d) < new Date());
const initials = (name: string) => name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
  OnLeave: 'bg-amber-50 text-amber-600 border-amber-200',
};

const TRIP_STATUS_COLORS: Record<string, string> = {
  Planned: 'bg-blue-50 text-blue-700 border-blue-200',
  Boarding: 'bg-purple-50 text-purple-700 border-purple-200',
  Departed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  InTransit: 'bg-green-50 text-green-700 border-green-200',
  Completed: 'bg-gray-100 text-gray-600 border-gray-200',
  Cancelled: 'bg-red-50 text-red-500 border-red-200',
  Delayed: 'bg-orange-50 text-orange-600 border-orange-200',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

function TripRow({ trip }: { trip: any }) {
  const [open, setOpen] = useState(false);
  const bus = trip.bus;
  const route = trip.route;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {route?.origin ?? '?'} → {route?.destination ?? '?'}
            </p>
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TRIP_STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {trip.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{fmt(trip.date)} · {trip.departureTime}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 grid grid-cols-2 gap-6">
          {/* bus */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Bus</p>
            {bus ? (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-500">
                    <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M7 18v2M17 18v2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{bus.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{bus.plateNumber} · {bus.capacity} seats</p>
                  <p className="text-xs text-gray-400">Last maint: {fmt(bus.lastMaintenanceDate)}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${bus.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>{bus.status}</span>
              </div>
            ) : <p className="text-xs text-gray-400 italic">No bus info</p>}
          </div>

          {/* route */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Route</p>
            {route ? (
              <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{route.name}</p>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${route.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>{route.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{route.distance} km</span>
                  <span>·</span>
                  <span>{Math.floor(route.duration / 60)}h {route.duration % 60}m</span>
                  <span>·</span>
                  <span>{route.totalTrips} total trips</span>
                </div>
                {route.stops?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {route.stops.map((s: any) => (
                      <span key={s.order} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                        {s.name} · ETB {s.fareFromOrigin}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="text-xs text-gray-400 italic">No route info</p>}
          </div>

          {/* trip meta */}
          <div className="col-span-2 grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            <Field label="Date">{fmt(trip.date)}</Field>
            <Field label="Departure">{trip.departureTime}</Field>
          </div>
        </div>
      )}
    </div>
  );
}

const DRIVER_STATUSES = ['Active', 'Inactive', 'Suspended', 'OnLeave'];

export default function DriverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: drivers, loading } = useAppSelector(s => s.drivers);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirm] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [driverTrips, setDriverTrips] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  useEffect(() => {
    if (!drivers.length) dispatch(fetchDrivers());
  }, [dispatch]);

  const driver = drivers.find((d: any) => d._id === id);

  // Fetch real trips for this driver from the API
  useEffect(() => {
    if (!id) return;
    setTripsLoading(true);
    client.service('trips')
      .find({ query: { driver: id, $populate: ['bus', 'route'], $limit: 50 } })
      .then((res: any) => setDriverTrips(res.data ?? res))
      .catch(() => setDriverTrips([]))
      .finally(() => setTripsLoading(false));
  }, [id]);

  useEffect(() => {
    if (driver) setForm({
      name: driver.name ?? '', phone: driver.phone ?? '', nationalId: driver.nationalId ?? '',
      licenseNumber: driver.licenseNumber ?? '', licenseExpiry: driver.licenseExpiry?.slice(0, 10) ?? '',
      status: driver.status ?? 'Active',
      address: { city: driver.address?.city ?? '', subCity: driver.address?.subCity ?? '' },
      emergencyContact: { name: driver.emergencyContact?.name ?? '', phone: driver.emergencyContact?.phone ?? '' },
    });
  }, [driver]);

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const setAddr = (k: string, v: string) => setForm((f: any) => ({ ...f, address: { ...f.address, [k]: v } }));
  const setEC = (k: string, v: string) => setForm((f: any) => ({ ...f, emergencyContact: { ...f.emergencyContact, [k]: v } }));

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(updateDriver({ id: id!, data: form }));
    setEditOpen(false);
  };

  const handleDelete = async () => {
    await dispatch(deleteDriver(id!));
    navigate('/drivers');
  };

  if (loading && !driver) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-7 w-40 skeleton rounded-lg" />
        <div className="h-48 skeleton rounded-xl" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-gray-400 text-sm">Driver not found.</p>
        <Button variant="secondary" onClick={() => navigate('/drivers')}>← Back to Drivers</Button>
      </div>
    );
  }

  const licExpired = isExpired(driver.licenseExpiry);

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-3xl">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/drivers')} className="text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
          Drivers
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{driver.name}</span>
      </div>

      {/* hero card */}
      <Card className="flex flex-col gap-0">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white text-xl font-bold flex items-center justify-center shrink-0">
              {initials(driver.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{driver.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{driver.phone} · <span className="font-mono">{driver.licenseNumber}</span></p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[driver.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {driver.status}
                </span>
                {licExpired && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                    License Expired
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-center">
            <div className="flex flex-col items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{driver.totalTrips ?? 0}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Trips</p>
            </div>
            <div className="flex flex-col items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{driver.totalKm ?? 0}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">KM</p>
            </div>
            <div className="flex flex-col items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{driver.violations ?? 0}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Violations</p>
            </div>
          </div>
        </div>

        {/* info grid */}
        <div className="grid grid-cols-3 gap-x-10 gap-y-4 px-5 pb-5 border-t border-gray-100 pt-4">
          <Field label="National ID">{driver.nationalId ?? '—'}</Field>
          <Field label="License Expiry">
            <span className={licExpired ? 'text-red-600 font-semibold' : ''}>
              {fmt(driver.licenseExpiry)}
              {licExpired && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Expired</span>}
            </span>
          </Field>
          <Field label="Address">
            {[driver.address?.city, driver.address?.subCity].filter(Boolean).join(', ') || '—'}
          </Field>
          <Field label="Emergency Contact">
            {driver.emergencyContact?.name
              ? `${driver.emergencyContact.name} · ${driver.emergencyContact.phone}`
              : '—'}
          </Field>
        </div>

        {/* actions */}
        <div className="flex items-center gap-2 px-5 pb-5">
          <Button onClick={() => setEditOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 mr-1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </Button>
          {!confirmDelete ? (
            <Button variant="secondary" onClick={() => setConfirm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 mr-1.5">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Delete <strong>{driver.name}</strong>?</p>
              <Button variant="danger" size="sm" onClick={handleDelete}>Yes, Delete</Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </Card>

      {/* trips */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">Trip History</p>
          <span className="text-xs text-gray-400">{driverTrips.length} trips</span>
        </div>

        {tripsLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        ) : driverTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 bg-white border border-gray-200 rounded-2xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-300">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-sm text-gray-400">No trips found for this driver.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {driverTrips.map((trip: any) => (
              <TripRow key={trip._id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {form && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Driver" subtitle={`Editing ${driver.name}`}>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name *" value={form.name} onChange={(e: any) => set('name', e.target.value)} required />
              <Input label="Phone *" value={form.phone} onChange={(e: any) => set('phone', e.target.value)} required />
            </div>
            <Input label="National ID *" value={form.nationalId} onChange={(e: any) => set('nationalId', e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="License Number *" value={form.licenseNumber} onChange={(e: any) => set('licenseNumber', e.target.value)} required />
              <Input label="License Expiry *" type="date" value={form.licenseExpiry} onChange={(e: any) => set('licenseExpiry', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" value={form.address.city} onChange={(e: any) => setAddr('city', e.target.value)} />
              <Input label="Sub City" value={form.address.subCity} onChange={(e: any) => setAddr('subCity', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Emergency Contact Name" value={form.emergencyContact.name} onChange={(e: any) => setEC('name', e.target.value)} />
              <Input label="Emergency Contact Phone" value={form.emergencyContact.phone} onChange={(e: any) => setEC('phone', e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-600">Status</p>
              <div className="flex gap-2">
                {DRIVER_STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${form.status === s ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 text-gray-400 hover:border-gray-300'
                      }`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
