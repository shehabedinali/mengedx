import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCompanies, updateCompany } from '@/store/slices/companySlice';
import { client } from '@/store/feathers';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';

const STATUS_COLORS: Record<string, string> = {
  Active:    'bg-green-50 text-green-700 border-green-200',
  Inactive:  'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
};
const STATUSES = ['Active', 'Inactive', 'Suspended'];
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const initials = (n: string) => n?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) {
  return (
    <Card className="flex flex-col gap-1 py-4 px-5">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

export default function CompanyDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: companies, loading } = useAppSelector((s: any) => s.companies);

  const [tab, setTab]           = useState<'overview' | 'buses' | 'drivers' | 'trips' | 'staff'>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm]         = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>({ buses: [], drivers: [], trips: [], staff: [] });
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => { if (!companies.length) dispatch(fetchCompanies()); }, [dispatch, companies.length]);

  const company = companies.find((c: any) => c._id === id);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? '', code: company.code ?? '', email: company.email ?? '',
        phone: company.phone ?? '', status: company.status ?? 'Active',
        address: { city: company.address?.city ?? '', region: company.address?.region ?? '', street: company.address?.street ?? '', country: company.address?.country ?? 'Ethiopia' },
        settings: { currency: company.settings?.currency ?? 'ETB', timezone: company.settings?.timezone ?? 'Africa/Addis_Ababa', allowBooking: company.settings?.allowBooking ?? true },
      });
    }
  }, [company]);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    Promise.all([
      client.service('buses').find({ query: { company: id, $limit: 200 } }),
      client.service('drivers').find({ query: { company: id, $limit: 200 } }),
      client.service('trips').find({ query: { company: id, $limit: 200, $populate: ['route', 'bus'] } }),
      client.service('users').find({ query: { company: id, role: { $in: ['Manager', 'Admin', 'Ticketer', 'Dispatcher', 'Cashier'] }, $limit: 200 } }),
    ]).then(([buses, drivers, trips, staff]) => {
      setCompanyData({
        buses:   buses.data ?? buses,
        drivers: drivers.data ?? drivers,
        trips:   trips.data ?? trips,
        staff:   staff.data ?? staff,
      });
    }).catch(() => {}).finally(() => setDataLoading(false));
  }, [id]);

  const set     = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setAddr = (k: string, v: string) => setForm((f: any) => ({ ...f, address: { ...f.address, [k]: v } }));
  const setSett = (k: string, v: any)   => setForm((f: any) => ({ ...f, settings: { ...f.settings, [k]: v } }));

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(updateCompany({ id: id!, data: form }));
    setEditOpen(false);
  };

  if (loading && !company) return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="h-7 w-40 skeleton rounded-lg" />
      <div className="h-48 skeleton rounded-2xl" />
    </div>
  );

  if (!company) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <p className="text-gray-400 text-sm">Company not found.</p>
      <Button variant="secondary" onClick={() => navigate('/companies')}>← Back to Companies</Button>
    </div>
  );

  const { buses, drivers, trips, staff } = companyData;
  const activeBuses   = buses.filter((b: any) => b.status === 'Active').length;
  const activeDrivers = drivers.filter((d: any) => d.status === 'Active').length;
  const plannedTrips  = trips.filter((t: any) => t.status === 'Planned').length;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'buses',    label: `Buses (${buses.length})` },
    { key: 'drivers',  label: `Drivers (${drivers.length})` },
    { key: 'trips',    label: `Trips (${trips.length})` },
    { key: 'staff',    label: `Staff (${staff.length})` },
  ] as const;

  return (
    <div className="flex flex-col gap-5 max-w-4xl animate-fade-in">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/companies')} className="text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
          Companies
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{company.name}</span>
      </div>

      {/* hero */}
      <Card className="flex flex-col gap-0">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white text-xl font-bold flex items-center justify-center shrink-0">{initials(company.name)}</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-sm text-gray-400 font-mono mt-0.5">{company.code}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[company.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{company.status}</span>
                <span className="text-[11px] text-gray-400">{company.settings?.currency ?? 'ETB'}</span>
                {company.settings?.allowBooking && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Booking On</span>}
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
        <div className="grid grid-cols-3 gap-x-10 gap-y-4 px-5 pb-5 border-t border-gray-100 pt-4">
          <Field label="Email">{company.email || '—'}</Field>
          <Field label="Phone">{company.phone || '—'}</Field>
          <Field label="Address">{[company.address?.city, company.address?.region, company.address?.country].filter(Boolean).join(', ') || '—'}</Field>
          <Field label="Timezone">{company.settings?.timezone || '—'}</Field>
          <Field label="Owner">{company.owner?.name ?? company.owner ?? '—'}</Field>
          <Field label="Created">{fmt(company.createdAt)}</Field>
        </div>
      </Card>

      {/* stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total Buses"    value={buses.length} />
        <StatCard label="Active Buses"   value={activeBuses}   color="text-green-600" />
        <StatCard label="Total Drivers"  value={drivers.length} />
        <StatCard label="Active Drivers" value={activeDrivers}  color="text-green-600" />
        <StatCard label="Planned Trips"  value={plannedTrips}   color="text-blue-600" />
      </div>

      {/* tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={['px-4 py-1.5 rounded-lg text-xs font-medium transition-all', tab === t.key ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* tab content */}
      <Card key={tab} className="animate-fade-in">
        {dataLoading ? (
          <div className="flex flex-col gap-2">{Array.from({length:3}).map((_,i) => <div key={i} className="h-12 skeleton rounded-xl" />)}</div>
        ) : tab === 'overview' ? (
          <div className="flex flex-col gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Recent Trips</p>
            {trips.slice(0, 5).length === 0 ? <p className="text-sm text-gray-400 italic">No trips yet.</p> : (
              <div className="flex flex-col gap-2">
                {trips.slice(0, 5).map((t: any) => (
                  <div key={t._id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.route?.origin ?? '—'} → {t.route?.destination ?? '—'}</p>
                      <p className="text-xs text-gray-400">{fmt(t.date)} · {t.departureTime ?? '—'}</p>
                    </div>
                    <Badge status={t.status ?? 'Planned'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'buses' ? (
          <div className="flex flex-col gap-2">
            {buses.length === 0 ? <p className="text-sm text-gray-400 italic">No buses registered.</p> : buses.map((b: any) => (
              <div key={b._id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-500"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{b.plateNumber} · {b.capacity} seats</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{b.status}</span>
              </div>
            ))}
          </div>
        ) : tab === 'drivers' ? (
          <div className="flex flex-col gap-2">
            {drivers.length === 0 ? <p className="text-sm text-gray-400 italic">No drivers registered.</p> : drivers.map((d: any) => (
              <div key={d._id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{initials(d.name)}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.phone} · {d.licenseNumber}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{d.status}</span>
              </div>
            ))}
          </div>
        ) : tab === 'trips' ? (
          <div className="flex flex-col gap-2">
            {trips.length === 0 ? <p className="text-sm text-gray-400 italic">No trips found.</p> : trips.map((t: any) => (
              <div key={t._id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.route?.origin ?? '—'} → {t.route?.destination ?? '—'}</p>
                  <p className="text-xs text-gray-400">{fmt(t.date)} · {t.departureTime ?? '—'} · {t.bus?.name ?? '—'}</p>
                </div>
                <Badge status={t.status ?? 'Planned'} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {staff.length === 0 ? <p className="text-sm text-gray-400 italic">No staff found.</p> : staff.map((s: any) => (
              <div key={s._id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{initials(s.name)}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email} · {s.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">{s.role}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {form && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Company" subtitle={`Editing ${company.name}`}>
          <form onSubmit={handleEdit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} required className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Code *</label><input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} required className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">City</label><input value={form.address.city} onChange={e => setAddr('city', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Region</label><input value={form.address.region} onChange={e => setAddr('region', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
              <div className="flex gap-2">
                {STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.status === s ? `${STATUS_COLORS[s]} shadow-sm` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Settings</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Currency</label><input value={form.settings.currency} onChange={e => setSett('currency', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Timezone</label><input value={form.settings.timezone} onChange={e => setSett('timezone', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => setSett('allowBooking', !form.settings.allowBooking)}>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${form.settings.allowBooking ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.settings.allowBooking ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-xs font-semibold text-gray-600">Allow Booking</span>
              </label>
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
