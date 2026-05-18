import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStaff, createStaff, updateStaff } from '@/store/slices/staffSlice';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Card from '@/components/Card';

const ROLES       = ['Admin', 'Ticketer'];
const STATUSES    = ['Active', 'Inactive', 'Suspended'];
const DEPARTMENTS = ['Operations', 'Finance', 'Hr', 'It'];

const STATUS_COLORS: Record<string, string> = {
  Active:    'bg-green-50 text-green-700 border-green-200',
  Inactive:  'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
};

const ROLE_COLORS: Record<string, string> = {
  Admin:    'bg-purple-50 text-purple-700 border-purple-200',
  Ticketer: 'bg-blue-50 text-blue-700 border-blue-200',
};

const empty = { name: '', email: '', phone: '', role: 'Ticketer', status: 'Active', department: 'Operations', password: '' };

const initials = (name: string) => name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

function StaffCard({ member, onEdit, onClick }: { member: any; onEdit: () => void; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
            {initials(member.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{member.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[member.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {member.status}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {member.role}
        </span>
        {member.department && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
            {member.department}
          </span>
        )}
        {member.phone && (
          <span className="text-[11px] text-gray-400">{member.phone}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          {member.lastLogin ? `Last login: ${new Date(member.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Never logged in'}
        </p>
        <button onClick={e => { e.stopPropagation(); onEdit(); }} className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors">
          Edit
        </button>
      </div>
    </div>
  );
}

export default function Staff() {
  const dispatch = useAppDispatch();
  const navigate  = useNavigate();
  const { data, loading, error } = useAppSelector(s => s.staff);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm]       = useState(empty);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const user = useAppSelector(s => s.auth.user);
  const selectedCompanyId = useAppSelector(s => s.selectedCompany.companyId);
  const companyFilter = user?.role?.toLowerCase() === 'superadmin' ? (selectedCompanyId ?? undefined) : undefined;

  useEffect(() => { dispatch(fetchStaff({ company: companyFilter })); }, [dispatch, companyFilter]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({ name: m.name ?? '', email: m.email ?? '', phone: m.phone ?? '', role: m.role ?? 'Ticketer', status: m.status ?? 'Active', department: m.department ?? 'Operations', password: '' });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editing ? { name: form.name, phone: form.phone, role: form.role, status: form.status, department: form.department } : form;
    if (editing) await dispatch(updateStaff({ id: editing._id, data: payload }));
    else await dispatch(createStaff(form));
    setOpen(false);
    setForm(empty);
  };

  const filtered = data.filter((m: any) => {
    const q = search.toLowerCase();
    const matchSearch = m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.phone?.includes(q);
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const active    = data.filter((m: any) => m.status === 'Active').length;
  const suspended = data.filter((m: any) => m.status === 'Suspended').length;

  return (
    <div className="flex flex-col gap-5">

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} staff members</p>
        <Button onClick={openAdd}>+ Add Staff</Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Staff',  value: data.length, color: 'text-gray-900' },
          { label: 'Active',       value: active,      color: 'text-green-600' },
          { label: 'Suspended',    value: suspended,   color: suspended > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Ticketers', value: data.filter((m: any) => m.role === 'Ticketer').length, color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* search + filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search by name, email or phone…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white" />
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
          {['All', ...ROLES].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={['px-3 py-1.5 rounded-lg text-xs font-medium transition-all', roleFilter === r ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'].join(' ')}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <p className="text-sm text-gray-400">No staff members found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((m: any) => <StaffCard key={m._id} member={m} onEdit={() => openEdit(m)} onClick={() => navigate(`/staff/${m._id}`)} />)}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? 'Edit Staff Member' : 'Add New Staff'}
        subtitle={editing ? `Editing ${editing.name}` : 'Create a new staff account'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white text-lg font-bold flex items-center justify-center shrink-0">
              {form.name ? initials(form.name) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-400">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{form.name || <span className="text-gray-400 font-normal">Name will appear here</span>}</p>
              <p className="text-xs text-gray-400 mt-0.5">{form.email || '—'}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {form.role && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[form.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{form.role}</span>}
                {form.status && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[form.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{form.status}</span>}
              </div>
            </div>
          </div>

          {/* personal info */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Personal Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tigist Alemu" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Phone *</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 0911234567" required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
              </div>
            </div>
            {!editing && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Email *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. tigist@company.com" required
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Password *</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" required
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
                </div>
              </>
            )}
          </div>

          {/* role & department */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Role & Department</p>
            <div className="flex gap-2">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => set('role', r)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    form.role === r ? `${ROLE_COLORS[r]} shadow-sm border-current` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                  }`}>{r}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENTS.map(d => (
                <button key={d} type="button" onClick={() => set('department', d)}
                  className={`py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.department === d ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                  }`}>{d}</button>
              ))}
            </div>
          </div>

          {/* status */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button key={s} type="button" onClick={() => set('status', s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    form.status === s ? `${STATUS_COLORS[s]} shadow-sm` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                  }`}>{s}</button>
              ))}
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
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              {editing ? 'Save Changes' : 'Add Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
