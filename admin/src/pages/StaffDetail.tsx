import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStaff, updateStaff, deleteStaff } from '@/store/slices/staffSlice';
import { fetchCompanies } from '@/store/slices/companySlice';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import { getStaffRolesForUser, STAFF_ROLE_COLORS } from '@/constants/roles';
import { fromEthiopianPhone, stripLocalPhoneDigits, toEthiopianPhone } from '@/lib/phone';

const STATUSES = ['Active', 'Inactive', 'Suspended'];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  Assigned: 'bg-sky-50 text-sky-700 border-sky-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
};

const ROLE_COLORS = STAFF_ROLE_COLORS;

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const initials = (name: string) => name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector(s => s.staff);
  const companies = useAppSelector((s: any) => s.companies.data);
  const authUser = useAppSelector(s => s.auth.user);
  const isSuperAdmin = authUser?.role?.toLowerCase() === 'superadmin';
  const ROLES = [...getStaffRolesForUser(authUser?.role)];

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => { if (!data.length) dispatch(fetchStaff(undefined)); }, [dispatch, data.length]);
  useEffect(() => { if (isSuperAdmin) dispatch(fetchCompanies()); }, [dispatch, isSuperAdmin]);

  const member = data.find((m: any) => m._id === id);

  useEffect(() => {
    if (member) setForm({
      name: member.name ?? '',
      email: member.email ?? '',
      phone: fromEthiopianPhone(member.phone ?? ''),
      role: member.role ?? 'Ticketer',
      status: member.status ?? 'Active',
      company: (typeof member.company === 'object' && member.company?._id
        ? member.company._id
        : member.company) ?? '',
    });
  }, [member]);

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { company, ...rest } = form;
    const data: Record<string, string> = { ...rest, phone: toEthiopianPhone(form.phone) };
    if (isSuperAdmin && company) data.company = company;
    await dispatch(updateStaff({ id: id!, data }));
    setEditOpen(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await dispatch(deleteStaff(id!));
    navigate('/staff');
  };

  if (loading && !member) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl">
        <div className="h-7 w-40 skeleton rounded-lg" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-gray-400 text-sm">Staff member not found.</p>
        <Button variant="secondary" onClick={() => navigate('/staff')}>← Back to Staff</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl animate-fade-in">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/staff')} className="text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
          Staff
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{member.name}</span>
      </div>

      {/* hero card */}
      <Card className="flex flex-col gap-0">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white text-xl font-bold flex items-center justify-center shrink-0">
              {initials(member.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{member.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {member.role}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[member.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {member.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* info grid */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-4 px-5 pb-5 border-t border-gray-100 pt-4">
          <Field label="Phone">{member.phone ?? '—'}</Field>
          <Field label="Email">{member.email ?? '—'}</Field>
          <Field label="Last Login">{fmt(member.lastLogin)}</Field>
          <Field label="Owner">{member.isOwner ? 'Yes' : 'No'}</Field>
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
              <p className="text-sm text-red-600 font-medium">Delete <strong>{member.name}</strong>?</p>
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {form && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Staff Member" subtitle={`Editing ${member.name}`}>
          <form onSubmit={handleEdit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Personal Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Full Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} required
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
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
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm outline-none bg-white"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
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
              </div>
            </div>

            {isSuperAdmin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Company *</label>
                <select
                  value={form.company ?? ''}
                  onChange={e => set('company', e.target.value)}
                  required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select a company…</option>
                  {companies.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name ?? c.companyName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Role</p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => set('role', r)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.role === r ? `${ROLE_COLORS[r]} shadow-sm border-current` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                      }`}>{r}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
              <div className="flex gap-2">
                {STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.status === s ? `${STATUS_COLORS[s]} shadow-sm` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
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
