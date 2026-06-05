import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStaff, createStaff, updateStaff, deleteStaff } from '@/store/slices/staffSlice';
import { fetchCompanies } from '@/store/slices/companySlice';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Card from '@/components/Card';
import {
  getStaffRolesForUser,
  STAFF_ROLE_COLORS,
  ROLE_HINTS,
} from '@/constants/roles';
import { fromEthiopianPhone, stripLocalPhoneDigits, toEthiopianPhone } from '@/lib/phone';

const STATUSES = ['Active', 'Inactive', 'Suspended'];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  Assigned: 'bg-sky-50 text-sky-700 border-sky-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
};

const ROLE_COLORS = STAFF_ROLE_COLORS;

const ROLE_ICONS: Record<string, React.ReactNode> = {
  Admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Dispatcher: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  ),
  Cashier: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
};

const empty = {
  name: '', email: '', phone: '', role: 'Cashier',
  status: 'Active', password: '',
  company: '',  // chosen by superadmin
};

const initials = (name: string) =>
  name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({ member, onEdit, onClick }: { member: any; onEdit: () => void; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
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
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {ROLE_ICONS[member.role]}
          {member.role}
        </span>
        {member.phone && (
          <span className="text-[11px] text-gray-400">{member.phone}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          {member.lastLogin
            ? `Last login: ${new Date(member.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : 'Never logged in'}
        </p>
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Staff() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, loading, error } = useAppSelector(s => s.staff);
  const companies = useAppSelector((s: any) => s.companies.data);

  const user = useAppSelector(s => s.auth.user);
  const selectedCompanyId = useAppSelector(s => s.selectedCompany.companyId);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';

  // SuperAdmin can filter by company; others see their own company
  const companyFilter = isSuperAdmin ? (selectedCompanyId ?? undefined) : user?.company;

  const availableRoles = [...getStaffRolesForUser(user?.role)];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...empty, role: availableRoles[0] });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) dispatch(fetchCompanies());
  }, [dispatch, isSuperAdmin]);

  useEffect(() => {
    dispatch(fetchStaff({ company: companyFilter }));
  }, [dispatch, companyFilter]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...empty, role: availableRoles[0], company: '' });
    setOpen(true);
  };

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      name: m.name ?? '',
      email: m.email ?? '',
      phone: fromEthiopianPhone(m.phone ?? ''),
      role: m.role ?? availableRoles[0],
      status: m.status ?? 'Active',
      password: '',
      company: (typeof m.company === 'object' && m.company?._id ? m.company._id : m.company) ?? '',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = toEthiopianPhone(form.phone);
    if (editing) {
      const { password, company, ...payload } = form;
      const data: Record<string, string> = { ...payload, phone };
      if (company) data.company = company;
      if (password) data.password = password;
      await dispatch(updateStaff({ id: editing._id, data }));
    } else {
      await dispatch(createStaff({ ...form, phone }));
    }
    setOpen(false);
    setForm({ ...empty, role: availableRoles[0] });
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteStaff(id));
    setConfirmId(null);
  };

  // Filter list
  const displayRoles = availableRoles;
  const filtered = data.filter((m: any) => {
    const q = search.toLowerCase();
    const matchSearch = m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.phone?.includes(q);
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Stat counts
  const active = data.filter((m: any) => m.status === 'Active').length;
  const suspended = data.filter((m: any) => m.status === 'Suspended').length;
  const cashiers = data.filter((m: any) => m.role === 'Cashier').length;
  const dispatchers = data.filter((m: any) => m.role === 'Dispatcher').length;

  return (
    <div className="flex flex-col gap-5">

      {/* top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} staff members</p>
        <Button onClick={openAdd}>+ Add Staff</Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: data.length, color: 'text-gray-900' },
          { label: 'Active', value: active, color: 'text-green-600' },
          { label: 'Cashiers', value: cashiers, color: 'text-emerald-600' },
          {
            label: 'Dispatch', value: dispatchers, color: 'text-orange-600',
            sub: suspended > 0 ? `${suspended} suspended` : undefined
          },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-red-500">{s.sub}</p>}
          </Card>
        ))}
      </div>

      {/* search + role filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {['All', ...displayRoles].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleFilter === r ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <p className="text-sm text-gray-400">No staff members found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((m: any) => (
            <StaffCard
              key={m._id}
              member={m}
              onEdit={() => openEdit(m)}
              onClick={() => navigate(`/staff/${m._id}`)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4">
            <p className="text-sm font-bold text-gray-900">Remove this staff member?</p>
            <p className="text-xs text-gray-400">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Staff Member' : 'Add New Staff'}
        subtitle={editing ? `Editing ${editing.name}` : 'Create a new staff account'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* live preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white text-lg font-bold flex items-center justify-center shrink-0">
              {form.name ? initials(form.name) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-400">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {form.name || <span className="text-gray-400 font-normal">Name will appear here</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{form.email || '—'}</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {form.role && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[form.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {ROLE_ICONS[form.role]}{form.role}
                  </span>
                )}
                {form.status && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[form.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {form.status}
                  </span>
                )}
                {isSuperAdmin && form.company && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
                    {companies.find((c: any) => c._id === form.company)?.name
                      ?? companies.find((c: any) => c._id === form.company)?.companyName
                      ?? '—'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* company — superadmin can set on create and edit */}
          {isSuperAdmin && (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company *</p>
              <select
                value={form.company}
                onChange={e => set('company', e.target.value)}
                required
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
              >
                <option value="">Select a company…</option>
                {companies.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name ?? c.companyName}</option>
                ))}
              </select>
              {!form.company && !editing && (
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  You must select a company before adding staff.
                </p>
              )}
            </div>
          )}

          {/* personal info */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Personal Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Tigist Alemu"
                  required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Phone *</label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent transition-all">
                  <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-50 border-r border-gray-200 select-none shrink-0">
                    <span className="text-sm">🇪🇹</span>
                    <span className="text-sm font-medium text-gray-700">+251</span>
                  </div>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', stripLocalPhoneDigits(e.target.value))}
                    placeholder="912 345 678"
                    maxLength={9}
                    required
                    className="flex-1 min-w-0 px-3 py-2.5 text-sm outline-none bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-gray-600">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="e.g. tigist@company.com"
                  required
                  autoComplete="off"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
              {!editing && (
                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-600">Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>
            {editing && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">New Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Leave blank to keep current password"
                  minLength={8}
                  autoComplete="new-password"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>

          {/* role selection */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Role *</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableRoles.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('role', r)}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${form.role === r
                    ? `${ROLE_COLORS[r]} shadow-sm border-current`
                    : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                    }`}
                >
                  {ROLE_ICONS[r]}
                  {r}
                </button>
              ))}
            </div>

            {ROLE_HINTS[form.role] && (
              <p className={`text-[11px] rounded-lg px-3 py-2 border ${
                form.role === 'Admin' ? 'text-purple-600 bg-purple-50 border-purple-100'
                  : form.role === 'Cashier' ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : form.role === 'Dispatcher' ? 'text-orange-600 bg-orange-50 border-orange-100'
                      : 'text-blue-600 bg-blue-50 border-blue-100'
              }`}>
                {ROLE_HINTS[form.role]}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.status === s
                    ? `${STATUS_COLORS[s]} shadow-sm`
                    : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); setForm({ ...empty, role: availableRoles[0] }); }}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              {editing ? 'Save Changes' : 'Add Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
