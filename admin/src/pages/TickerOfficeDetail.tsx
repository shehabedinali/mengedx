import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchTickerOfficeById,
    fetchCompanyCashiers,
    resolveCompanyId,
    addUserToOffice,
    removeUserFromOffice,
    clearCurrent,
} from '@/store/slices/tickerOfficeSlice';
import { toast } from '@/store/slices/toastSlice';
import { isDispatcherRole } from '@/constants/roles';
import Card from '@/components/Card';
import Button from '@/components/Button';

const initials = (name: string) =>
    name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

export default function TickerOfficeDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const {
        current: office,
        detailLoading,
        companyCashiers,
        cashiersLoading,
    } = useAppSelector((s: any) => s.tickerOffices);
    const authUser = useAppSelector(s => s.auth.user);

    const [addOpen, setAddOpen] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);

    const userCompanyId = resolveCompanyId(authUser?.company);
    const isSuperAdmin = authUser?.role?.toLowerCase() === 'superadmin';
    const isDispatcher = isDispatcherRole(authUser?.role);

    /** Cashiers query company: dispatcher/admin/manager → logged-in user's company; superadmin → office company */
    const cashierCompanyId = useMemo(() => {
        if (!isSuperAdmin && userCompanyId) return userCompanyId;
        if (!office) return userCompanyId;
        return resolveCompanyId(office.company) ?? userCompanyId;
    }, [office, userCompanyId, isSuperAdmin]);

    // Fetch the office on mount
    useEffect(() => {
        if (id) dispatch(fetchTickerOfficeById(id));
        return () => { dispatch(clearCurrent()); };
    }, [id, dispatch]);

    // users service: company + role Cashier + status Active
    useEffect(() => {
        if (!cashierCompanyId) return;
        dispatch(fetchCompanyCashiers(cashierCompanyId));
    }, [cashierCompanyId, dispatch]);

    if (detailLoading || !office) {
        return (
            <div className="flex flex-col gap-4">
                <div className="h-8 w-48 skeleton rounded-xl" />
                <div className="h-40 skeleton rounded-2xl" />
                <div className="h-64 skeleton rounded-2xl" />
            </div>
        );
    }

    const resolveUserId = (u: unknown) =>
        String(typeof u === 'object' && u !== null ? (u as { _id: unknown })._id : u);

    // IDs already in the office
    const assignedIds = new Set((office.users ?? []).map(resolveUserId));

    // Cashiers not yet assigned (company + role query from users service)
    const available = companyCashiers.filter((c: any) => !assignedIds.has(String(c._id)));

    // Assigned cashiers (populated on office.users from API)
    const assignedUsers = (office.users ?? []).filter(
        (u: unknown) => typeof u === 'object' && u !== null && (u as { name?: string }).name
    );

    const handleAdd = async (userId: string) => {
        if (!id) return;
        const result = await dispatch(addUserToOffice({ officeId: id, userId }));
        if (addUserToOffice.fulfilled.match(result)) {
            dispatch(toast.success('Cashier added to office.'));
            dispatch(fetchTickerOfficeById(id));
            if (cashierCompanyId) dispatch(fetchCompanyCashiers(cashierCompanyId));
        } else {
            dispatch(toast.error((result.payload as string) || 'Failed to add cashier'));
        }
    };

    const handleRemove = async (userId: string) => {
        if (!id) return;
        setRemoving(userId);
        const result = await dispatch(removeUserFromOffice({ officeId: id, userId }));
        if (removeUserFromOffice.fulfilled.match(result)) {
            dispatch(toast.success('Cashier removed from office.'));
            dispatch(fetchTickerOfficeById(id));
            if (cashierCompanyId) dispatch(fetchCompanyCashiers(cashierCompanyId));
        } else {
            dispatch(toast.error((result.payload as string) || 'Failed to remove cashier'));
        }
        setRemoving(null);
    };

    const isActive = office.status === 'ACTIVE';

    return (
        <div className="flex flex-col gap-6">

            {/* ── Back + header ── */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/ticker-offices')}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Ticker Offices
                </button>
                <span className="text-gray-300">/</span>
                <h1 className="text-sm font-semibold text-gray-900 truncate">{office.name}</h1>
            </div>

            {/* ── Office info card ── */}
            <Card className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-sky-500">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{office.name}</h2>
                            {office.code && (
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{office.code}</p>
                            )}
                        </div>
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                        {office.status}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    {/* Address */}
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Address</p>
                        {(office.address?.city || office.address?.subCity) ? (
                            <p className="text-sm text-gray-700">
                                {[office.address?.city, office.address?.subCity].filter(Boolean).join(', ')}
                            </p>
                        ) : <p className="text-sm text-gray-400 italic">—</p>}
                        {office.address?.geoLocation?.latitude && (
                            <p className="text-xs text-gray-400 font-mono">
                                {office.address.geoLocation.latitude}, {office.address.geoLocation.longitude}
                            </p>
                        )}
                    </div>

                    {/* Contact */}
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Contact</p>
                        {office.contact?.phoneNumber && (
                            <p className="text-sm text-gray-700 flex items-center gap-1.5">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-gray-400 shrink-0">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                {office.contact.phoneNumber}
                            </p>
                        )}
                        {office.contact?.email && (
                            <p className="text-sm text-gray-700 flex items-center gap-1.5">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-gray-400 shrink-0">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                {office.contact.email}
                            </p>
                        )}
                        {!office.contact?.phoneNumber && !office.contact?.email && (
                            <p className="text-sm text-gray-400 italic">—</p>
                        )}
                    </div>
                </div>
            </Card>

            {/* ── Assigned Cashiers ── */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Assigned Cashiers</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {assignedIds.size} cashier{assignedIds.size !== 1 ? 's' : ''} assigned to this office
                        </p>
                    </div>
                    <Button onClick={() => {
                        const next = !addOpen;
                        setAddOpen(next);
                        if (next && cashierCompanyId) dispatch(fetchCompanyCashiers(cashierCompanyId));
                    }}>
                        {addOpen ? 'Close' : '+ Add Cashier'}
                    </Button>
                </div>

                {/* ── Add cashier panel ── */}
                {addOpen && (
                    <Card className="flex flex-col gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                            Available Cashiers — Active cashiers
                            {isDispatcher && userCompanyId && (
                                <span className="normal-case font-normal text-gray-400"> (your company)</span>
                            )}
                        </p>
                        {cashiersLoading ? (
                            <div className="flex flex-col gap-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
                            </div>
                        ) : available.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-200">
                                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                                <p className="text-xs text-gray-400">
                                    {companyCashiers.length === 0
                                        ? 'No cashiers found for this company.'
                                        : 'All company cashiers are already assigned.'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {available.map((c: any) => (
                                    <div
                                        key={c._id}
                                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                {initials(c.name)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900">{c.name}</p>
                                                <p className="text-[10px] text-gray-400">{c.phone ?? c.email ?? '—'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAdd(c._id)}
                                            className="flex items-center gap-1 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                                                <path d="M12 5v14M5 12h14" />
                                            </svg>
                                            Assign
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* ── Currently assigned list ── */}
                {assignedIds.size === 0 ? (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-200">
                                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                            </svg>
                            <p className="text-sm text-gray-400">No cashiers assigned yet.</p>
                            <p className="text-xs text-gray-300">Click "+ Add Cashier" to assign one.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-2">
                        {assignedUsers.map((u: any) => (
                            <div
                                key={u._id}
                                className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-4 hover:border-gray-300 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {/* avatar */}
                                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center shrink-0">
                                        {initials(u.name)}
                                    </div>
                                    {/* info */}
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Cashier
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                u.status === 'Assigned'
                                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                                    : u.status === 'Active'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : u.status === 'Suspended'
                                                            ? 'bg-red-50 text-red-600 border-red-200'
                                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}>
                                                {u.status ?? 'Assigned'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            {u.phone && (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3 text-gray-400">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                                    </svg>
                                                    {u.phone}
                                                </span>
                                            )}
                                            {u.email && (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3 text-gray-400">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                        <polyline points="22,6 12,13 2,6" />
                                                    </svg>
                                                    {u.email}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-gray-400">
                                                {u.lastLogin
                                                    ? `Last login: ${new Date(u.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                                    : 'Never logged in'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* remove */}
                                <button
                                    onClick={() => handleRemove(u._id)}
                                    disabled={removing === u._id}
                                    className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                                >
                                    {removing === u._id ? (
                                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    )}
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
