import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBuses, createBus } from '@/store/slices/busSlice';
import { fetchCompanies } from '@/store/slices/companySlice';
import { setSelectedCompany } from '@/store/slices/selectedCompanySlice';
import { toast } from '@/store/slices/toastSlice';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Card from '@/components/Card';

const empty = { name: '', plateNumber: '', capacity: '', status: 'Active', insuranceExpiry: '', registrationExpiry: '', company: '' };
const BUS_STATUSES = ['Active', 'Inactive', 'Maintenance', 'Retired'];

function BusCard({ bus, onClick }: { bus: any; onClick: () => void }) {
  const hasDriver = !!(bus.driver?._id ?? bus.driver);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-500">
              <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/>
              <circle cx="7" cy="15" r="1" fill="currentColor"/><circle cx="17" cy="15" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{bus.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{bus.plateNumber}</p>
          </div>
        </div>
        <Badge status={bus.status ?? 'Inactive'} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
          {bus.capacity} seats
        </span>
        <span className={`ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          hasDriver ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
        }`}>
          {hasDriver ? '✓ Driver' : 'No Driver'}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
            <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/>
          </svg>
          {bus.plateNumber}
        </span>
        {bus.insuranceExpiry && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 ml-auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Ins. {new Date(bus.insuranceExpiry).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end pt-1 border-t border-gray-100">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </button>
  );
}

export default function Buses() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, loading, error } = useAppSelector(s => s.buses);
  const companies = useAppSelector((s: any) => s.companies.data);
  const selectedCompanyId = useAppSelector((s: any) => s.selectedCompany.companyId);
  const [open, setOpen]         = useState(false);
  const [form, setForm]         = useState(empty);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const user = useAppSelector(s => s.auth.user);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
  const companyFilter = isSuperAdmin ? (selectedCompanyId ?? undefined) : user?.company;

  useEffect(() => { if (isSuperAdmin) dispatch(fetchCompanies()); }, [dispatch, isSuperAdmin]);
  useEffect(() => { dispatch(fetchBuses({ company: companyFilter })); }, [dispatch, companyFilter]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(createBus(form));
    if (createBus.fulfilled.match(result)) {
      dispatch(toast.success('Bus added successfully!'));
    } else {
      dispatch(toast.error(result.payload as string || 'Failed to add bus'));
    }
    setOpen(false);
    setForm(empty);
  };

  // filter client-side
  const filtered = data.filter((b: any) => {
    const matchSearch = b.name?.toLowerCase().includes(search.toLowerCase()) ||
                        b.plateNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active      = data.filter((b: any) => b.status === 'Active').length;
  const maintenance = data.filter((b: any) => b.status === 'Maintenance').length;

  return (
    <div className="flex flex-col gap-5">

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} buses total</p>
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
          <Button onClick={() => setOpen(true)}>+ Add Bus</Button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Buses',    value: data.length,  color: 'text-gray-900' },
          { label: 'Active',         value: active,       color: 'text-green-600' },
          { label: 'In Maintenance', value: maintenance,  color: 'text-orange-500' },
          { label: 'Inactive', value: data.filter((b: any) => b.status === 'Inactive').length, color: 'text-gray-500' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or plate…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300">
            <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/>
          </svg>
          <p className="text-sm text-gray-400">No buses found.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
            {['All', ...BUS_STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={['px-3 py-1.5 rounded-lg text-xs font-medium transition-all', statusFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'].join(' ')}>
                {s}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((bus: any) => (
              <BusCard key={bus._id} bus={bus} onClick={() => navigate(`/buses/${bus._id}`)} />
            ))}
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Bus" subtitle="Register a new bus to the fleet">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Basic Info</p>
            {isSuperAdmin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Company *</label>
                <select value={form.company} onChange={e => set('company', e.target.value)} required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white">
                  <option value="">Select a Company</option>
                  {companies.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Bus Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Selam Bus 01" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Plate Number *</label>
                <input value={form.plateNumber} onChange={e => set('plateNumber', e.target.value)} placeholder="e.g. AA-12345" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Seating Capacity *</label>
              <div className="relative">
                <input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g. 45" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all pr-14" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">seats</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
            <div className="grid grid-cols-4 gap-2">
              {BUS_STATUSES.map(s => {
                const statusColors: Record<string,string> = {
                  Active:      'border-green-300 bg-green-50 text-green-700',
                  Inactive:    'border-gray-300 bg-gray-100 text-gray-600',
                  Maintenance: 'border-orange-300 bg-orange-50 text-orange-700',
                  Retired:     'border-red-300 bg-red-50 text-red-600',
                };
                return (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                      form.status === s ? statusColors[s] + ' shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                    }`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Documents</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Insurance Expiry</label>
                <input type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Registration Expiry</label>
                <input type="date" value={form.registrationExpiry} onChange={e => set('registrationExpiry', e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setOpen(false); setForm(empty); }}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/>
              </svg>
              Add Bus
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
