import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchTickerOffices,
    createTickerOffice,
    updateTickerOffice,
    deleteTickerOffice,
} from '@/store/slices/tickerOfficeSlice';
import { fetchCompanies } from '@/store/slices/companySlice';
import { setSelectedCompany } from '@/store/slices/selectedCompanySlice';
import { toast } from '@/store/slices/toastSlice';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Card from '@/components/Card';
import { isDispatcherRole } from '@/constants/roles';

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

const empty = {
    name: '',
    code: '',
    company: '',
    status: 'ACTIVE' as string,
    address: { city: '', subCity: '', geoLocation: { latitude: '', longitude: '' } },
    contact: { phoneNumber: '', email: '' },
};

// ─── Office Card ──────────────────────────────────────────────────────────────
function OfficeCard({
    office,
    onEdit,
    onDelete,
    onClick,
    canManage = true,
}: {
    office: any;
    onEdit: () => void;
    onDelete: () => void;
    onClick: () => void;
    canManage?: boolean;
}) {
    const isActive = office.status === 'ACTIVE';

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer"
        >            {/* header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-sky-500">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{office.name}</p>
                        {office.code && (
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{office.code}</p>
                        )}
                    </div>
                </div>
                <span
                    className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${isActive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                >
                    {office.status}
                </span>
            </div>

            {/* address */}
            {(office.address?.city || office.address?.subCity) && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0 text-gray-400">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span>{[office.address?.city, office.address?.subCity].filter(Boolean).join(', ')}</span>
                    {office.address?.geoLocation?.latitude && office.address?.geoLocation?.longitude && (
                        <span className="text-gray-300 font-mono text-[10px] ml-1">
                            ({office.address.geoLocation.latitude}, {office.address.geoLocation.longitude})
                        </span>
                    )}
                </div>
            )}

            {/* contact */}
            <div className="flex items-center gap-3 flex-wrap">
                {office.contact?.phoneNumber && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-gray-400">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {office.contact.phoneNumber}
                    </span>
                )}
                {office.contact?.email && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-gray-400">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        {office.contact.email}
                    </span>
                )}
            </div>

            {/* staff count */}
            {office.users?.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-gray-400">
                        <circle cx="9" cy="8" r="3" /><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75M22 20c0-3-2.5-5.5-6-5.5" />
                    </svg>
                    {office.users.length} staff assigned
                </div>
            )}

            {/* actions */}
            {canManage ? (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
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
            ) : (
                <div className="flex items-center justify-end pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Open to assign cashiers</span>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TickerOffices() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { data, loading, error } = useAppSelector((s: any) => s.tickerOffices);
    const companies = useAppSelector((s: any) => s.companies.data);
    const selectedCompanyId = useAppSelector((s: any) => s.selectedCompany.companyId);

    const user = useAppSelector(s => s.auth.user);
    const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
    const isDispatcher = isDispatcherRole(user?.role);
    const canManageOffices = !isDispatcher;
    const companyFilter = isSuperAdmin ? (selectedCompanyId ?? undefined) : user?.company;

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ ...empty });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    useEffect(() => {
        if (isSuperAdmin) dispatch(fetchCompanies());
    }, [dispatch, isSuperAdmin]);

    useEffect(() => {
        dispatch(fetchTickerOffices({ company: companyFilter }));
    }, [dispatch, companyFilter]);

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const setAddr = (k: string, v: string) =>
        setForm(f => ({ ...f, address: { ...f.address, [k]: v } }));
    const setGeo = (k: string, v: string) =>
        setForm(f => ({ ...f, address: { ...f.address, geoLocation: { ...f.address.geoLocation, [k]: v } } }));
    const setContact = (k: string, v: string) =>
        setForm(f => ({ ...f, contact: { ...f.contact, [k]: v } }));

    const openAdd = () => {
        setEditing(null);
        setForm({ ...empty, company: isSuperAdmin ? '' : (user?.company ?? '') });
        setOpen(true);
    };

    const openEdit = (o: any) => {
        setEditing(o);
        setForm({
            name: o.name ?? '',
            code: o.code ?? '',
            company: o.company ?? '',
            status: o.status ?? 'ACTIVE',
            address: {
                city: o.address?.city ?? '',
                subCity: o.address?.subCity ?? '',
                geoLocation: {
                    latitude: o.address?.geoLocation?.latitude ?? '',
                    longitude: o.address?.geoLocation?.longitude ?? '',
                },
            },
            contact: { phoneNumber: o.contact?.phoneNumber ?? '', email: o.contact?.email ?? '' },
        });
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            const { company: _company, ...data } = form;
            const result = await dispatch(updateTickerOffice({ id: editing._id, data }));
            if (updateTickerOffice.fulfilled.match(result)) {
                dispatch(toast.success('Ticker office updated!'));
            } else {
                dispatch(toast.error((result.payload as string) || 'Failed to update'));
            }
        } else {
            const result = await dispatch(createTickerOffice(form));
            if (createTickerOffice.fulfilled.match(result)) {
                dispatch(toast.success('Ticker office created!'));
            } else {
                dispatch(toast.error((result.payload as string) || 'Failed to create'));
            }
        }
        setOpen(false);
        setForm({ ...empty });
    };

    const handleDelete = async (id: string) => {
        const result = await dispatch(deleteTickerOffice(id));
        if (deleteTickerOffice.fulfilled.match(result)) {
            dispatch(toast.success('Ticker office deleted.'));
        } else {
            dispatch(toast.error('Failed to delete ticker office.'));
        }
        setConfirmId(null);
    };

    const filtered = data.filter((o: any) => {
        const q = search.toLowerCase();
        const matchSearch =
            o.name?.toLowerCase().includes(q) ||
            o.code?.toLowerCase().includes(q) ||
            o.address?.city?.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'All' || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const active = data.filter((o: any) => o.status === 'ACTIVE').length;
    const inactive = data.filter((o: any) => o.status === 'INACTIVE').length;

    return (
        <div className="flex flex-col gap-5">

            {/* top bar */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{data.length} ticker office{data.length !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                        <select
                            value={selectedCompanyId ?? ''}
                            onChange={e => dispatch(setSelectedCompany(e.target.value || null))}
                            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
                        >
                            <option value="">All Companies</option>
                            {companies.map((c: any) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    {canManageOffices && <Button onClick={openAdd}>+ Add Office</Button>}
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* stat cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Offices', value: data.length, color: 'text-gray-900' },
                    { label: 'Active', value: active, color: 'text-green-600' },
                    { label: 'Inactive', value: inactive, color: inactive > 0 ? 'text-red-500' : 'text-gray-900' },
                ].map(s => (
                    <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
                        <p className="text-xs text-gray-400">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </Card>
                ))}
            </div>

            {/* search */}
            <div className="relative max-w-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    placeholder="Search by name, code or city…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                />
            </div>

            {/* grid */}
            {loading ? (
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 skeleton rounded-2xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <p className="text-sm text-gray-400">No ticker offices found.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
                        {['All', ...STATUSES].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={[
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                    statusFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black',
                                ].join(' ')}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {filtered.map((o: any) => (
                            <OfficeCard
                                key={o._id}
                                office={o}
                                onClick={() => navigate(`/ticker-offices/${o._id}`)}
                                onEdit={() => openEdit(o)}
                                onDelete={() => setConfirmId(o._id)}
                                canManage={canManageOffices}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Delete confirm */}
            {confirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4">
                        <p className="text-sm font-bold text-gray-900">Delete this ticker office?</p>
                        <p className="text-xs text-gray-400">This cannot be undone. Staff assigned to this office will be unlinked.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmId(null)}
                                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(confirmId)}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit Ticker Office' : 'Add Ticker Office'}
                subtitle={editing ? `Editing ${editing.name}` : 'Register a new ticket office location'}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* preview */}
                    <div className="flex items-center gap-4 p-4 bg-sky-50 rounded-2xl border border-sky-100">
                        <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-sky-500">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {form.name || <span className="text-gray-400 font-normal italic">Office name</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">
                                {form.code || <span className="text-gray-300">CODE</span>}
                            </p>
                            {(form.address.city || form.address.subCity) && (
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {[form.address.city, form.address.subCity].filter(Boolean).join(', ')}
                                </p>
                            )}
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${form.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                            {form.status}
                        </span>
                    </div>

                    {/* company — superadmin only on create */}
                    {isSuperAdmin && !editing && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600">Company *</label>
                            <select
                                value={form.company}
                                onChange={e => set('company', e.target.value)}
                                required
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                            >
                                <option value="">Select a Company</option>
                                {companies.map((c: any) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
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

                    {/* basic info */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Office Info</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Office Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    placeholder="e.g. Meskel Square Office"
                                    required
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Office Code</label>
                                <input
                                    value={form.code}
                                    onChange={e => set('code', e.target.value)}
                                    placeholder="e.g. MSQ-01"
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* address */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Address</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">City</label>
                                <input
                                    value={form.address.city}
                                    onChange={e => setAddr('city', e.target.value)}
                                    placeholder="e.g. Addis Ababa"
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Sub City</label>
                                <input
                                    value={form.address.subCity}
                                    onChange={e => setAddr('subCity', e.target.value)}
                                    placeholder="e.g. Bole"
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.address.geoLocation.latitude}
                                    onChange={e => setGeo('latitude', e.target.value)}
                                    placeholder="e.g. 9.0054"
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.address.geoLocation.longitude}
                                    onChange={e => setGeo('longitude', e.target.value)}
                                    placeholder="e.g. 38.7636"
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* contact */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Contact</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Phone Number</label>
                                <input
                                    value={form.contact.phoneNumber}
                                    onChange={e => setContact('phoneNumber', e.target.value)}
                                    placeholder="e.g. 0911234567"
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Email</label>
                                <input
                                    type="email"
                                    value={form.contact.email}
                                    onChange={e => setContact('email', e.target.value)}
                                    placeholder="e.g. office@company.com"
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* status */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
                        <div className="flex gap-2">
                            {STATUSES.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => set('status', s)}
                                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.status === s
                                        ? s === 'ACTIVE'
                                            ? 'border-green-300 bg-green-50 text-green-700 shadow-sm'
                                            : 'border-gray-300 bg-gray-100 text-gray-600 shadow-sm'
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
                            onClick={() => { setOpen(false); setForm({ ...empty }); }}
                            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            {editing ? 'Save Changes' : 'Create Office'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
