import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchManagersByCompany, updateManager } from '@/store/slices/managersSlice';
import { fetchCompanies } from '@/store/slices/companySlice';
import { client } from '@/store/feathers';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { MANAGER_PAGE_ROLES, MANAGER_PAGE_ROLE_COLORS } from '@/constants/roles';

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const initials = (n: string) => n?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  Suspended: 'bg-red-50 text-red-600 border-red-200',
};

const ROLE_COLORS = MANAGER_PAGE_ROLE_COLORS;
const ROLES = [...MANAGER_PAGE_ROLES];
const STATUSES = ['Active', 'Inactive', 'Suspended'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

export default function ManagerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: managers, loading } = useAppSelector((s: any) => s.managers);
  const { data: companies } = useAppSelector((s: any) => s.companies);

  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (!managers.length) dispatch(fetchManagersByCompany(''));
    if (!companies.length) dispatch(fetchCompanies());
  }, [dispatch]);

  const manager = managers.find((m: any) => m._id === id);

  useEffect(() => {
    if (manager) setForm({
      name: manager.name ?? '',
      phone: manager.phone ?? '',
      role: manager.role ?? 'Manager',
      status: manager.status ?? 'Active',
      company: manager.company ?? '',
      isOwner: manager.isOwner ?? false,
    });
  }, [manager]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { company: _company, ...payload } = form;
    await dispatch(updateManager({ id: id!, data: payload }));
    setEditOpen(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await client.service('users').remove(id); navigate('/managers'); }
    catch { setDeleting(false); setConfirm(false); }
  };

  if (loading && !manager) return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
    </div>
  );

  if (!manager) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <p className="text-gray-400 text-sm">Manager not found.</p>
      <Button variant="secondary" onClick={() => navigate('/managers')}>← Back to Users</Button>
    </div>
  );

  const company = companies.find((c: any) => c._id === (manager.company?._id ?? manager.company));

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-3xl">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/managers')} className="text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
          Users
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{manager.name}</span>
      </div>

      {/* hero card */}
      <Card className="flex flex-col gap-0">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white text-xl font-bold flex items-center justify-center shrink-0">
              {initials(manager.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{manager.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{manager.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ROLE_COLORS[manager.role] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {manager.role}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[manager.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {manager.status}
                </span>
                {manager.isOwner && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">Owner</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* info grid */}
        <div className="grid grid-cols-3 gap-x-10 gap-y-4 px-5 pb-5 border-t border-gray-100 pt-4">
          <Field label="Phone">{manager.phone || '—'}</Field>
          <Field label="Email">{manager.email || '—'}</Field>
          <Field label="Company">
            {company ? (
              <button onClick={() => navigate(`/companies/${company._id}`)} className="text-indigo-600 hover:underline font-medium">
                {company.name}
              </button>
            ) : '—'}
          </Field>
          <Field label="Last Login">{manager.lastLogin ? fmt(manager.lastLogin) : 'Never'}</Field>
          <Field label="Created">{fmt(manager.createdAt)}</Field>
          <Field label="Owner">{manager.isOwner ? 'Yes' : 'No'}</Field>
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
          {!confirm ? (
            <Button variant="secondary" onClick={() => setConfirm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 mr-1.5">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Delete <strong>{manager.name}</strong>?</p>
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
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit User" subtitle={`Editing ${manager.name}`}>
          <form onSubmit={handleEdit} className="flex flex-col gap-5">

            {/* preview */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gray-900 text-white text-base font-bold flex items-center justify-center shrink-0">
                {initials(form.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{form.name || '—'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[form.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{form.role}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[form.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{form.status}</span>
                  {form.isOwner && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 border-amber-200 text-amber-700">Owner</span>}
                </div>
              </div>
            </div>

            {/* company — read-only on edit */}
            {company && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Company</label>
                <p className="text-sm text-gray-700 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                  {company.name}
                </p>
              </div>
            )}

            {/* name + phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Phone *</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
            </div>

            {/* role */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Role</p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => set('role', r)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${form.role === r ? `${ROLE_COLORS[r]} shadow-sm` : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                      }`}>{r}</button>
                ))}
              </div>
            </div>

            {/* status */}
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

            {/* isOwner */}
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
              <button type="button" onClick={() => setEditOpen(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
