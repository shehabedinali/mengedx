import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDrivers, createDriver, updateDriver } from '@/store/slices/driverSlice';
import { fetchCompanies } from '@/store/slices/companySlice';
import { setSelectedCompany } from '@/store/slices/selectedCompanySlice';
import { toast } from '@/store/slices/toastSlice';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Card from '@/components/Card';
import { isDispatcherRole } from '@/constants/roles';

const empty = {
  name: '', phone: '', nationalId: '', licenseNumber: '', licenseExpiry: '', status: 'Active',
  address: { city: '', subCity: '' },
  emergencyContact: { name: '', phone: '' },
  company: '',
};

const DRIVER_STATUSES = ['Active', 'Inactive', 'Suspended', 'OnLeave'];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
  OnLeave: 'bg-amber-50 text-amber-600 border-amber-200',
};

const isExpired = (d: string) => !!(d && new Date(d) < new Date());
const isExpiringSoon = (d: string) => { if (!d) return false; const diff = (new Date(d).getTime() - Date.now()) / 86400000; return diff >= 0 && diff <= 30; };
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const initials = (name: string) => name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

function DriverCard({ driver, onEdit, onClick, canEdit }: { driver: any; onEdit: () => void; onClick: () => void; canEdit?: boolean }) {
  const licExpired = isExpired(driver.licenseExpiry);
  const licSoon = isExpiringSoon(driver.licenseExpiry);

  return (
    <div onClick={onClick} className="group bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
            {initials(driver.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{driver.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{driver.phone}</p>
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_COLORS[driver.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {driver.status}
        </span>
      </div>

      {/* license + trips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 font-mono">
          {driver.licenseNumber}
        </span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
          {driver.totalTrips ?? 0} trips
        </span>
      </div>

      {/* location */}
      {(driver.address?.city || driver.address?.subCity) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          {[driver.address?.city, driver.address?.subCity].filter(Boolean).join(', ')}
        </div>
      )}

      {/* footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <div>
          {licExpired && (
            <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">License Expired</span>
          )}
          {!licExpired && licSoon && (
            <span className="text-[10px] font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">License Expiring Soon</span>
          )}
          {!licExpired && !licSoon && (
            <span className="text-[10px] text-gray-400">Lic. {fmt(driver.licenseExpiry)}</span>
          )}
        </div>
        {canEdit && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

export default function Drivers() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, loading, error } = useAppSelector(s => s.drivers);
  const companies = useAppSelector((s: any) => s.companies.data);
  const selectedCompanyId = useAppSelector((s: any) => s.selectedCompany.companyId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState('All');

  const user = useAppSelector(s => s.auth.user);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
  const isDispatcher = isDispatcherRole(user?.role);
  const companyFilter = isSuperAdmin ? (selectedCompanyId ?? undefined) : user?.company;


  useEffect(() => { if (isSuperAdmin) dispatch(fetchCompanies()); }, [dispatch, isSuperAdmin]);
  useEffect(() => { dispatch(fetchDrivers({ company: companyFilter })); }, [dispatch, companyFilter]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setAddr = (k: string, v: string) => setForm(f => ({ ...f, address: { ...f.address, [k]: v } }));
  const setEC = (k: string, v: string) => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, [k]: v } }));

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      name: d.name ?? '', phone: d.phone ?? '', nationalId: d.nationalId ?? '',
      licenseNumber: d.licenseNumber ?? '', licenseExpiry: d.licenseExpiry?.slice(0, 10) ?? '',
      status: d.status ?? 'Active',
      address: { city: d.address?.city ?? '', subCity: d.address?.subCity ?? '' },
      emergencyContact: { name: d.emergencyContact?.name ?? '', phone: d.emergencyContact?.phone ?? '' },
      company: d.company ?? '',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { company: _company, ...data } = form;
      const result = await dispatch(updateDriver({ id: editing._id, data }));
      if (updateDriver.fulfilled.match(result)) dispatch(toast.success('Driver updated successfully!'));
      else dispatch(toast.error(result.payload as string || 'Failed to update driver'));
    } else {
      const result = await dispatch(createDriver(form));
      if (createDriver.fulfilled.match(result)) dispatch(toast.success('Driver added successfully!'));
      else dispatch(toast.error(result.payload as string || 'Failed to add driver'));
    }
    setOpen(false);
    setForm(empty);
  };

  const filtered = data.filter((d: any) => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.includes(search);
    const matchStatus = assignedFilter === 'Assigned' || statusFilter === 'All' || d.status === statusFilter;
    const hasAssignment = !!(d.assignedBus ?? d.bus);
    const matchAssigned = assignedFilter !== 'Assigned' || hasAssignment;
    return matchSearch && matchStatus && matchAssigned;
  });

  const active = data.filter((d: any) => d.status === 'Active').length;
  const suspended = data.filter((d: any) => d.status === 'Suspended').length;
  const onLeave = data.filter((d: any) => d.status === 'OnLeave').length;
  const expiredLic = data.filter((d: any) => isExpired(d.licenseExpiry)).length;

  return (
    <div className="flex flex-col gap-5">

      {/* top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} drivers total</p>
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
          {!isDispatcher && <Button onClick={openAdd}>+ Add Driver</Button>}
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Drivers', value: data.length, color: 'text-gray-900' },
          { label: 'Active', value: active, color: 'text-green-600' },
          { label: 'Suspended', value: suspended, color: suspended > 0 ? 'text-red-600' : 'text-gray-900' },
          {
            label: 'On Leave', value: onLeave, color: 'text-amber-500',
            sub: expiredLic > 0 ? `${expiredLic} license expired` : undefined
          },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-red-500">{s.sub}</p>}
          </Card>
        ))}
      </div>

      {/* search + filter */}
      <div className="relative max-w-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, license or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
        />
      </div>

      {/* driver cards grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <p className="text-sm text-gray-400">No drivers match your search.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
            {['All', ...DRIVER_STATUSES, 'Assigned'].map(s => (
              <button key={s}
                onClick={() => { s === 'Assigned' ? setAssignedFilter(s) : (setStatusFilter(s), setAssignedFilter('All')); }}
                className={['px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  (s === 'Assigned' ? assignedFilter === 'Assigned' : statusFilter === s && assignedFilter === 'All') ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black',
                ].join(' ')}>
                {s}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((d: any) => (
              <DriverCard key={d._id} driver={d} onEdit={() => openEdit(d)} onClick={() => navigate(`/drivers/${d._id}`)} canEdit={!isDispatcher} />
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Driver' : 'Add New Driver'} subtitle={editing ? `Editing ${editing.name}` : 'Register a new driver to the fleet'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* driver avatar + name preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white text-lg font-bold flex items-center justify-center shrink-0 shadow-sm">
              {form.name ? form.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-400">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {form.name || <span className="text-gray-400 font-normal">Driver name will appear here</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{form.phone || '—'}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {form.licenseNumber && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-mono">
                    {form.licenseNumber}
                  </span>
                )}
                {form.status && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[form.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                    {form.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* company — selectable on create only */}
          {isSuperAdmin && !editing && (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Company *</label>
                <select value={form.company} onChange={e => set('company', e.target.value)} required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white">
                  <option value="">Select a Company</option>
                  {companies.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          )}
          {isSuperAdmin && editing && form.company && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company</p>
              <p className="text-sm text-gray-700 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                {companies.find((c: any) => c._id === form.company)?.name ?? '—'}
              </p>
            </div>
          )}

          {/* personal info */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Personal Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Abebe Kebede" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Phone *</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 0911234567" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">National ID *</label>
              <input value={form.nationalId} onChange={e => set('nationalId', e.target.value)} placeholder="e.g. ETH-123456" required
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">City</label>
                <input value={form.address.city} onChange={e => setAddr('city', e.target.value)} placeholder="e.g. Addis Ababa"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Sub City</label>
                <input value={form.address.subCity} onChange={e => setAddr('subCity', e.target.value)} placeholder="e.g. Bole"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
            </div>
          </div>

          {/* license */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">License</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">License Number *</label>
                <input value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="e.g. DL-789012" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">License Expiry *</label>
                <input type="date" value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
            </div>
          </div>

          {/* status */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
            <div className="grid grid-cols-4 gap-2">
              {DRIVER_STATUSES.map(s => {
                const colors: Record<string, string> = {
                  Active: 'border-green-300 bg-green-50 text-green-700',
                  Inactive: 'border-gray-300 bg-gray-100 text-gray-600',
                  Suspended: 'border-red-300 bg-red-50 text-red-600',
                  OnLeave: 'border-amber-300 bg-amber-50 text-amber-700',
                };
                const icons: Record<string, React.ReactNode> = {
                  Active: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M5 13l4 4L19 7" /></svg>,
                  Inactive: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>,
                  Suspended: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>,
                  OnLeave: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                };
                return (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${form.status === s ? colors[s] + ' shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                      }`}>
                    {icons[s]}
                    <span className="text-[10px] font-bold">{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* emergency contact */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Contact Name *</label>
                <input value={form.emergencyContact.name} onChange={e => setEC('name', e.target.value)} placeholder="e.g. Tigist Kebede" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Contact Phone *</label>
                <input value={form.emergencyContact.phone} onChange={e => setEC('phone', e.target.value)} placeholder="e.g. 0922345678" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setOpen(false); setForm(empty); }}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              {editing ? 'Save Changes' : 'Add Driver'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
