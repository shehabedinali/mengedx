import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCompanies, createCompany, updateCompany, deleteCompany } from '@/store/slices/companySlice';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';

const STATUSES = ['Active', 'Inactive', 'Suspended'];
const STATUS_COLORS: Record<string, string> = {
  Active:    'bg-green-50 text-green-700 border-green-200',
  Inactive:  'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
};
const emptyForm = {
  name: '', code: '', email: '', phone: '', status: 'Active',
  address: { city: 'Addis Ababa', region: '', street: '', country: 'Ethiopia' },
  settings: { currency: 'ETB', timezone: 'Africa/Addis_Ababa', allowBooking: true },
};
const initials = (n: string) => n?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

export default function Companies() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, loading, error } = useAppSelector((s: any) => s.companies);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [form, setForm]         = useState<any>(emptyForm);
  const [search, setSearch]     = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => { dispatch(fetchCompanies()); }, [dispatch]);

  const set     = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setAddr = (k: string, v: string) => setForm((f: any) => ({ ...f, address: { ...f.address, [k]: v } }));
  const setSett = (k: string, v: any)   => setForm((f: any) => ({ ...f, settings: { ...f.settings, [k]: v } }));

  const openAdd  = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name ?? '', code: c.code ?? '', email: c.email ?? '', phone: c.phone ?? '', status: c.status ?? 'Active',
      address: { city: c.address?.city ?? '', region: c.address?.region ?? '', street: c.address?.street ?? '', country: c.address?.country ?? 'Ethiopia' },
      settings: { currency: c.settings?.currency ?? 'ETB', timezone: c.settings?.timezone ?? 'Africa/Addis_Ababa', allowBooking: c.settings?.allowBooking ?? true },
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await dispatch(updateCompany({ id: editing._id, data: form }));
    else await dispatch(createCompany(form));
    setOpen(false);
  };

  const filtered = data.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} companies</p>
        <Button onClick={openAdd}>+ Add Company</Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',     value: data.length,                                              color: 'text-gray-900' },
          { label: 'Active',    value: data.filter((c: any) => c.status === 'Active').length,    color: 'text-green-600' },
          { label: 'Suspended', value: data.filter((c: any) => c.status === 'Suspended').length, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Search by name, code or email…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white" />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <p className="text-sm text-gray-400">No companies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((c: any) => (
            <div key={c._id} onClick={() => navigate(`/companies/${c._id}`)}
              className="group bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">{initials(c.name)}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{c.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{c.code}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{c.status}</span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-400">
                {c.email && <span>{c.email}</span>}
                {c.phone && <span>{c.phone}</span>}
                {c.address?.city && <span>{c.address.city}, {c.address.country}</span>}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">{c.settings?.currency ?? 'ETB'}</span>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(c)} className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">Edit</button>
                  <button onClick={() => setConfirmId(c._id)} className="text-xs font-semibold text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4">
            <p className="text-sm font-bold text-gray-900">Delete this company?</p>
            <p className="text-xs text-gray-400">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmId(null)}>Cancel</Button>
              <Button variant="danger" onClick={async () => { await dispatch(deleteCompany(confirmId)); setConfirmId(null); }}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Company' : 'Add New Company'} subtitle={editing ? `Editing ${editing.name}` : 'Register a new transport company'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Company Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Selam Bus" required className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Code *</label>
                <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. SELAM" required className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@company.com" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0911234567" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Address</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">City</label>
                <input value={form.address.city} onChange={e => setAddr('city', e.target.value)} placeholder="Addis Ababa" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Region</label>
                <input value={form.address.region} onChange={e => setAddr('region', e.target.value)} placeholder="Addis Ababa" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Street</label>
              <input value={form.address.street} onChange={e => setAddr('street', e.target.value)} placeholder="e.g. Bole Road" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Currency</label>
                <input value={form.settings.currency} onChange={e => setSett('currency', e.target.value)} placeholder="ETB" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Timezone</label>
                <input value={form.settings.timezone} onChange={e => setSett('timezone', e.target.value)} placeholder="Africa/Addis_Ababa" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setSett('allowBooking', !form.settings.allowBooking)}>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.settings.allowBooking ? 'bg-gray-900' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.settings.allowBooking ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-xs font-semibold text-gray-600">Allow Booking</span>
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all">{editing ? 'Save Changes' : 'Add Company'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
