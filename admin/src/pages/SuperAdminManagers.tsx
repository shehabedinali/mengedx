import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCompanies } from '@/store/slices/companySlice';
import { fetchManagersByCompany, createManager, updateManager, deleteManager } from '@/store/slices/managersSlice';
import { setSelectedCompany } from '@/store/slices/selectedCompanySlice';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';

const ROLES = ['SuperAdmin', 'Admin', 'Manager', 'Ticketer', 'Customer'];
const STATUSES = ['Active', 'Inactive', 'Suspended'];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
};

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-red-50 text-red-700 border-red-200',
  Admin: 'bg-purple-50 text-purple-700 border-purple-200',
  Manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Ticketer: 'bg-blue-50 text-blue-700 border-blue-200',
  Customer: 'bg-gray-50 text-gray-600 border-gray-200',
};

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'Manager', status: 'Active', company: '', isOwner: false };
const initials = (n: string) => n?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function ManagerCard({ manager, onEdit, onDelete, onNavigate }: { manager: any; onEdit: () => void; onDelete: () => void; onNavigate: () => void }) {
  return (
    <div
      onClick={onNavigate}
      className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-200 hover:border-gray-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
            {initials(manager.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{manager.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{manager.email}</p>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[manager.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {manager.status}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[manager.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {manager.role}
        </span>
        {manager.phone && <span className="text-[11px] text-gray-400">{manager.phone}</span>}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          {manager.lastLogin ? `Last login: ${fmt(manager.lastLogin)}` : 'Never logged in'}
        </p>
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-xs font-semibold text-red-400 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function SuperAdminManagers() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: companies } = useAppSelector((s: any) => s.companies);
  const { data: managers, loading: managersLoading, error } = useAppSelector((s: any) => s.managers);
  const selectedCompanyId = useAppSelector((s: any) => s.selectedCompany.companyId);
  const user = useAppSelector((s: any) => s.auth.user);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => { dispatch(fetchCompanies()); }, [dispatch]);
  useEffect(() => { dispatch(fetchManagersByCompany(selectedCompanyId ?? '')); }, [dispatch, selectedCompanyId]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({ name: m.name ?? '', email: m.email ?? '', phone: m.phone ?? '', password: '', role: m.role ?? 'Manager', status: m.status ?? 'Active', company: m.company ?? '', isOwner: m.isOwner ?? false });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = form.phone.startsWith('+251') ? form.phone : `+251${form.phone.replace(/^0+/, '')}`;
    const payload = { ...form, phone, company: form.company || null };
    if (editing) {
      const { password, email, ...rest } = payload;
      await dispatch(updateManager({ id: editing._id, data: rest }));
    } else {
      await dispatch(createManager(payload));
    }
    setOpen(false);
  };

  const filtered = managers.filter((m: any) => {
    const q = search.toLowerCase();
    const matchSearch = m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.phone?.includes(q);
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const active = managers.filter((m: any) => m.status === 'Active').length;
  const suspended = managers.filter((m: any) => m.status === 'Suspended').length;

  return (
    <div className="flex flex-col gap-5">

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{managers.length} user{managers.length !== 1 ? 's' : ''}</p>
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
          <Button onClick={openAdd}>+ Add User</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: managers.length, color: 'text-gray-900' },
          { label: 'Active', value: active, color: 'text-green-600' },
          { label: 'Suspended', value: suspended, color: suspended > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Admins', value: managers.filter((m: any) => m.role === 'Admin').length, color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {managersLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <p className="text-sm text-gray-400">No users found.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search by name, email or phone…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white" />
            </div>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {['All', ...ROLES].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleFilter === r ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((m: any) => (
              <ManagerCard key={m._id} manager={m} onEdit={() => openEdit(m)} onDelete={() => dispatch(deleteManager(m._id))} onNavigate={() => navigate(`/managers/${m._id}`)} />
            ))}
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? 'Edit User' : 'Add New User'}
        subtitle={editing ? `Editing ${editing.name}` : 'Create a new admin or manager account'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white text-lg font-bold flex items-center justify-center shrink-0">
              {form.name ? initials(form.name) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-400">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{form.name || <span className="text-gray-400 font-normal">Name will appear here</span>}</p>
              <p className="text-xs text-gray-400 mt-0.5">{form.email || '—'}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[form.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{form.role}</span>
                {form.status && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[form.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{form.status}</span>}
                {form.isOwner && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 border-amber-200 text-amber-700">Owner</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Company</label>
            <select value={form.company} onChange={e => set('company', e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
              <option value="">— No Company —</option>
              {companies.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Abebe Kebede" required
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Phone *</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gray-900">
                <span className="px-3 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 border-r border-gray-200">+251</span>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="911234567" required
                  className="flex-1 px-3 py-2.5 text-sm outline-none" />
              </div>
            </div>
          </div>

          {!editing && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. abebe@company.com" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Password *</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Role *</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => set('role', r)}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${form.role === r ? `${ROLE_COLORS[r]} shadow-sm` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                    }`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button key={s} type="button" onClick={() => set('status', s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.status === s ? `${STATUS_COLORS[s]} shadow-sm` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                    }`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-700">Company Owner</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Mark this user as the owner of the company</p>
            </div>
            <button type="button" onClick={() => set('isOwner', !form.isOwner)}
              className={`w-10 h-6 rounded-full transition-colors relative ${form.isOwner ? 'bg-gray-900' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isOwner ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              {editing ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
