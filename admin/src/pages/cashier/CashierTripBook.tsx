import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrips } from '@/store/slices/tripSlice';
import { createBooking } from '@/store/slices/bookingSlice';
import { resolveCompanyId } from '@/store/slices/tickerOfficeSlice';
import { toast } from '@/store/slices/toastSlice';
import { stripLocalPhoneDigits, toEthiopianPhone } from '@/lib/phone';
import Card from '@/components/Card';

const ACTIVE_STATUSES = ['Planned', 'Boarding', 'Delayed'];

const STATUS_COLORS: Record<string, string> = {
    Planned: 'bg-blue-50 text-blue-700 border-blue-200',
    Boarding: 'bg-purple-50 text-purple-700 border-purple-200',
    Departed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    InTransit: 'bg-orange-50 text-orange-700 border-orange-200',
    Completed: 'bg-green-50 text-green-700 border-green-200',
    Cancelled: 'bg-red-50 text-red-600 border-red-200',
    Delayed: 'bg-amber-50 text-amber-700 border-amber-200',
};

const ACCENT: Record<string, string> = {
    Completed: 'bg-green-400', Cancelled: 'bg-red-400',
    InTransit: 'bg-orange-400', Departed: 'bg-orange-400',
    Boarding: 'bg-purple-400', Delayed: 'bg-amber-400',
};

function tripFare(trip: any): number {
    return trip?.route?.stops?.[0]?.fareFromOrigin ?? 0;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
            <p className="text-xs text-gray-400 shrink-0">{label}</p>
            <div className="text-xs font-semibold text-gray-900 text-right">{value ?? '—'}</div>
        </div>
    );
}

// ─── Seat Grid builder ────────────────────────────────────────────────────────
// Fills seats left-to-right per row. With sections [{A,3},{B,4}] and 3L+2R:
//   row 1 → A1 A2 A3 | B1 B2
//   row 2 → B3 B4 _  | _  _
// Last row is full-width, no aisle.
function buildSeatGrid(seatMap: any): {
    regularRows: { label: string | null }[][];
    lastRow: { label: string }[];
    leftCols: number;
    rightCols: number;
    totalRows: number;
    colHeaders: string[];
} {
    const layout = seatMap?.layout ?? {};
    const leftCols = layout.leftCols ?? 2;
    const rightCols = layout.rightCols ?? 2;
    const totalCols = leftCols + rightCols;
    const totalRows = layout.rows ?? 10;
    const lastRowCount = seatMap?.numberofLastRowSeats ?? totalCols;
    const regularRows = Math.max(1, totalRows - 1);

    // flat seat list: A1..A3, B1..B4, ...
    const allSeats: string[] = [];
    for (const seg of (seatMap?.map ?? [])) {
        if (!seg.identifier?.trim()) continue;
        for (let n = 1; n <= seg.numberofSeats; n++) allSeats.push(`${seg.identifier}${n}`);
    }

    // fill grid left-to-right per row
    const grid: { label: string | null }[][] = Array.from({ length: regularRows }, () =>
        Array(totalCols).fill(null).map(() => ({ label: null }))
    );
    let idx = 0;
    for (let r = 0; r < regularRows && idx < allSeats.length; r++)
        for (let c = 0; c < totalCols && idx < allSeats.length; c++)
            grid[r][c] = { label: allSeats[idx++] };

    // last row
    const lastRow: { label: string }[] = [];
    if (idx < allSeats.length) {
        for (let i = 0; i < lastRowCount && idx + i < allSeats.length; i++)
            lastRow.push({ label: allSeats[idx + i] });
    } else {
        for (let i = 0; i < lastRowCount; i++) lastRow.push({ label: `L${i + 1}` });
    }

    // column headers: identifier of the first row's seat in each column
    const colHeaders = Array.from({ length: totalCols }, (_, c) => {
        const lbl = grid[0]?.[c]?.label;
        return lbl ? lbl.replace(/\d+$/, '') : '';
    });

    return { regularRows: grid, lastRow, leftCols, rightCols, totalRows, colHeaders };
}

// ─── Seat Button ──────────────────────────────────────────────────────────────
interface SeatButtonProps {
    label: string;
    booked: boolean;
    chosen: boolean;
    bookable: boolean;
    onToggle: (seat: string) => void;
}
function SeatButton({ label, booked, chosen, bookable, onToggle }: SeatButtonProps) {
    const textSize = label.length >= 3 ? 'text-[9px]' : 'text-[11px]';
    return (
        <button
            type="button"
            disabled={booked || !bookable}
            onClick={() => onToggle(label)}
            title={booked ? `${label} — Booked` : chosen ? `${label} — Selected` : `${label} — Available`}
            className={`w-11 h-10 rounded-xl ${textSize} font-bold transition-all border-2 flex items-center justify-center
        ${booked
                    ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                    : chosen
                        ? 'bg-gray-900 text-white border-gray-900 scale-95 shadow-md'
                        : bookable
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-400 hover:scale-105'
                            : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                }`}
        >
            {label}
        </button>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CashierTripBook() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector(s => s.auth.user);
    const { data: trips, loading } = useAppSelector(s => s.trips);
    const { creating } = useAppSelector(s => s.bookings);
    const companyId = resolveCompanyId(user?.company);

    const [passengerName, setPassengerName] = useState('');
    const [phone, setPhone] = useState('');
    const [emergName, setEmergName] = useState('');
    const [emergPhone, setEmergPhone] = useState('');
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'MobileMoney' | 'BankTransfer'>('Cash');
    const [totalManual, setTotalManual] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [bookingStatus, setBookingStatus] = useState<'Booked' | 'Pending' | 'PendingPayment'>('Booked');
    const [selectedStop, setSelectedStop] = useState<any>(null);

    useEffect(() => {
        if (companyId) dispatch(fetchTrips({ company: companyId }));
    }, [dispatch, companyId]);

    const trip = useMemo(() => trips.find((t: any) => t._id === id), [trips, id]);

    // default stop → final destination
    useEffect(() => {
        if (trip?.route?.stops?.length) {
            const sorted = [...trip.route.stops].sort((a: any, b: any) => a.order - b.order);
            setSelectedStop(sorted[sorted.length - 1]);
        }
    }, [trip]);

    const farePerSeat = selectedStop?.fareFromOrigin ?? tripFare(trip);
    const capacity = trip?.bus?.capacity ?? 0;
    const bookedSeats: string[] = trip?.bookedSeats ?? [];
    const isBookable = !!(trip && ACTIVE_STATUSES.includes(trip.status) && (trip.availableSeats ?? 0) > 0);

    // build seat grid
    const seatGrid = useMemo(() => {
        const sm = trip?.bus?.seatMap;
        if (sm?.layout && sm?.map?.length) return buildSeatGrid(sm);

        // seatMap exists but missing layout — synthesise
        if (sm?.map?.length) {
            return buildSeatGrid({
                layout: { leftCols: 3, rightCols: 2, rows: Math.ceil(capacity / 5) + 1 },
                numberofLastRowSeats: capacity % 5 || 5,
                map: sm.map,
            });
        }

        // no seatMap — fallback with identifier "A"
        const total = capacity;
        const lc = 3, rc = 2, tc = lc + rc;
        const regRows = Math.max(1, Math.ceil(total / tc) - 1);
        const grid: { label: string | null }[][] = Array.from({ length: regRows }, (_, r) =>
            Array.from({ length: tc }, (_, c) => {
                const n = r * tc + c + 1;
                return { label: n <= total ? `A${n}` : null };
            })
        );
        const lastStart = regRows * tc + 1;
        const lastRow = Array.from(
            { length: Math.min(tc, Math.max(0, total - regRows * tc)) },
            (_, i) => ({ label: `A${lastStart + i}` })
        );
        return { regularRows: grid, lastRow, leftCols: lc, rightCols: rc, totalRows: regRows + 1, colHeaders: Array(tc).fill('A') };
    }, [trip, capacity]);

    const totalAmount = farePerSeat > 0 ? selectedSeats.length * farePerSeat : Number(totalManual) || 0;
    const paid = Number(paidAmount) || 0;

    useEffect(() => {
        if (farePerSeat > 0 && selectedSeats.length > 0)
            setPaidAmount(String(selectedSeats.length * farePerSeat));
        else if (selectedSeats.length === 0)
            setPaidAmount('');
    }, [farePerSeat, selectedSeats.length]);

    function toggleSeat(seat: string) {
        if (bookedSeats.includes(seat)) return;
        setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
    }

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !selectedSeats.length || !phone) {
            dispatch(toast.error('Select at least one seat and enter passenger phone.')); return;
        }
        if (totalAmount <= 0) {
            dispatch(toast.error('Enter a valid total amount.')); return;
        }
        const result = await dispatch(createBooking({
            trip: id,
            seats: selectedSeats,
            phoneNumber: toEthiopianPhone(phone),
            passengerName,
            emergencyContact: { name: emergName || passengerName, phoneNumber: emergPhone || toEthiopianPhone(phone) },
            totalAmount,
            paidAmount: paid,
            paymentMethod,
            paymentStatus: paid >= totalAmount ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid',
            status: bookingStatus,
        }));
        if (createBooking.fulfilled.match(result)) {
            dispatch(toast.success('Booking created successfully.'));
            navigate('/cashier/bookings');
        } else {
            dispatch(toast.error((result.payload as string) || 'Booking failed'));
        }
    };

    // ── loading ──
    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <div className="h-8 w-48 skeleton rounded-lg" />
                <div className="grid grid-cols-5 gap-6">
                    <div className="col-span-2 h-96 skeleton rounded-2xl" />
                    <div className="col-span-3 h-96 skeleton rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <p className="text-sm text-gray-400">Trip not found.</p>
                <button onClick={() => navigate('/cashier/trips')}
                    className="text-xs font-medium text-gray-500 hover:text-black underline">← Back to Trips</button>
            </div>
        );
    }

    const avail = trip.availableSeats ?? 0;
    const bkd = Math.max(0, capacity - avail);
    const occ = capacity > 0 ? Math.round((bkd / capacity) * 100) : 0;
    const stops = trip.route?.stops ? [...trip.route.stops].sort((a: any, b: any) => a.order - b.order) : [];
    const layout = trip.bus?.seatMap?.layout;

    return (
        <div className="flex flex-col gap-5">

            {/* breadcrumb */}
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => navigate('/cashier/trips')}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Trips
                </button>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-gray-300">
                    <path d="M9 18l6-6-6-6" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">
                    {trip.route?.origin ?? '—'} → {trip.route?.destination ?? '—'}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {trip.status}
                </span>
            </div>

            {/* not-bookable warning */}
            {!isBookable && (
                <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-amber-500 shrink-0">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    <p className="text-sm font-medium text-amber-800">
                        This trip is <strong>{trip.status}</strong> — not available for booking.
                        You can still view the seat map below.
                    </p>
                </div>
            )}

            {/* main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                {/* ── LEFT: trip info ── */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* route card */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        <div className={`h-1.5 ${ACCENT[trip.status] ?? 'bg-blue-400'}`} />
                        <div className="p-5 flex flex-col gap-4">

                            {/* origin → destination */}
                            <div className="flex items-stretch gap-3">
                                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                                    <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-100" />
                                    <div className="flex-1 w-px bg-gray-200" />
                                    <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-100" />
                                </div>
                                <div className="flex flex-col justify-between gap-2 flex-1">
                                    <div>
                                        <p className="text-base font-bold text-gray-900">{trip.route?.origin ?? '—'}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{trip.route?.name}</p>
                                    </div>
                                    <p className="text-base font-bold text-gray-900">{trip.route?.destination ?? '—'}</p>
                                </div>
                            </div>

                            {/* schedule */}
                            <div className="flex flex-col rounded-xl border border-gray-100 overflow-hidden">
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Schedule</p>
                                </div>
                                <div className="px-4 divide-y divide-gray-50">
                                    <Field label="Date" value={trip.date
                                        ? new Date(trip.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                                        : '—'} />
                                    <Field label="Departure" value={trip.departureTime ?? '—'} />
                                    {trip.route?.distance && <Field label="Distance" value={`${trip.route.distance} km`} />}
                                    {trip.route?.duration != null && (
                                        <Field label="Duration" value={
                                            trip.route.duration >= 60
                                                ? `${Math.floor(trip.route.duration / 60)}h ${trip.route.duration % 60 > 0 ? `${trip.route.duration % 60}m` : ''}`
                                                : `${trip.route.duration}m`
                                        } />
                                    )}
                                </div>
                            </div>

                            {/* bus */}
                            {trip.bus && (
                                <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-500">
                                            <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M7 18v2M17 18v2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">{trip.bus.name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{trip.bus.plateNumber}</p>
                                        {trip.bus.seatMap && (
                                            <p className="text-[10px] text-gray-400 mt-0.5">Map: {trip.bus.seatMap.code} · {trip.bus.seatMap.numberOfSeats} seats</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-lg font-bold ${avail > 0 ? 'text-green-700' : 'text-red-600'}`}>{avail}</p>
                                        <p className="text-[10px] text-gray-400">available</p>
                                    </div>
                                </div>
                            )}

                            {/* occupancy bar */}
                            {capacity > 0 && (
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span>Seat occupancy</span>
                                        <span className="font-semibold text-gray-700">{bkd} / {capacity} booked ({occ}%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${occ >= 90 ? 'bg-red-500' : occ >= 60 ? 'bg-orange-400' : 'bg-green-500'}`}
                                            style={{ width: `${occ}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{avail} available</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />{bkd} booked</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* stops & fares */}
                    {stops.length > 0 && (
                        <Card className="p-0 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    Stops & Fares <span className="normal-case font-normal text-gray-300 ml-1">· click to set fare</span>
                                </p>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5">
                                {stops.map((stop: any) => {
                                    const isActive = selectedStop?._id === stop._id;
                                    return (
                                        <button key={stop._id} type="button" onClick={() => setSelectedStop(stop)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all text-left ${isActive ? 'border-gray-900 bg-gray-900' : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                                                }`}>
                                            <div className="flex items-center gap-2.5">
                                                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isActive ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-600'
                                                    }`}>{stop.order}</span>
                                                <p className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>{stop.name}</p>
                                            </div>
                                            <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>ETB {stop.fareFromOrigin}</p>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedStop && (
                                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-[10px] text-gray-400">Fare to <span className="font-semibold text-gray-700">{selectedStop.name}</span></p>
                                    <p className="text-xs font-bold text-gray-900">ETB {selectedStop.fareFromOrigin} / seat</p>
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                {/* ── RIGHT: seat map + booking form ── */}
                <div className="lg:col-span-3 flex flex-col gap-5">

                    {/* seat map */}
                    <Card className="p-0 overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Seat Map</p>
                                {layout && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {layout.rows} rows · {seatGrid.leftCols} + {seatGrid.rightCols} cols
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-lg bg-gray-100 border-2 border-gray-200 inline-block" />Booked
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-lg bg-green-50 border-2 border-green-200 inline-block" />Available
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-lg bg-gray-900 inline-block" />Selected
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            {/* driver front */}
                            <div className="flex justify-center mb-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                    Driver · Front
                                </div>
                            </div>

                            {/* column headers — show identifier (A, B…) */}
                            <div className="flex items-center gap-1 mb-2 justify-center">
                                <span className="w-5 shrink-0" />
                                {seatGrid.colHeaders.slice(0, seatGrid.leftCols).map((id, i) => (
                                    <div key={`lh-${i}`} className="w-11 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {id || `C${i + 1}`}
                                    </div>
                                ))}
                                <div className="w-5" />
                                {seatGrid.colHeaders.slice(seatGrid.leftCols).map((id, i) => (
                                    <div key={`rh-${i}`} className="w-11 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {id || `C${seatGrid.leftCols + i + 1}`}
                                    </div>
                                ))}
                            </div>

                            {/* seat grid */}
                            {capacity === 0 ? (
                                <p className="text-xs text-gray-400 italic text-center py-8">No seat map available for this bus.</p>
                            ) : (
                                <div className="flex flex-col gap-1.5">

                                    {/* regular rows */}
                                    {seatGrid.regularRows.map((row, ri) => (
                                        <div key={ri} className="flex items-center gap-1 justify-center">
                                            <span className="w-5 text-[9px] font-semibold text-gray-300 text-right shrink-0">{ri + 1}</span>
                                            {/* left side */}
                                            {row.slice(0, seatGrid.leftCols).map((cell, ci) =>
                                                cell.label ? (
                                                    <SeatButton key={cell.label} label={cell.label}
                                                        booked={bookedSeats.includes(cell.label)}
                                                        chosen={selectedSeats.includes(cell.label)}
                                                        bookable={isBookable}
                                                        onToggle={toggleSeat} />
                                                ) : (
                                                    <div key={`el-${ri}-${ci}`} className="w-11 h-10 shrink-0" />
                                                )
                                            )}
                                            {/* aisle */}
                                            <div className="w-5 flex items-center justify-center shrink-0">
                                                <div className="border-l-2 border-dashed border-gray-200 h-8" />
                                            </div>
                                            {/* right side */}
                                            {row.slice(seatGrid.leftCols).map((cell, ci) =>
                                                cell.label ? (
                                                    <SeatButton key={cell.label} label={cell.label}
                                                        booked={bookedSeats.includes(cell.label)}
                                                        chosen={selectedSeats.includes(cell.label)}
                                                        bookable={isBookable}
                                                        onToggle={toggleSeat} />
                                                ) : (
                                                    <div key={`er-${ri}-${ci}`} className="w-11 h-10 shrink-0" />
                                                )
                                            )}
                                        </div>
                                    ))}

                                    {/* last row — full width, no aisle */}
                                    {seatGrid.lastRow.length > 0 && (
                                        <div className="flex items-center gap-1 justify-center border-t border-dashed border-gray-200 pt-1.5 mt-0.5">
                                            <span className="w-5 text-[9px] font-bold text-gray-400 text-right shrink-0">{seatGrid.totalRows}</span>
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {seatGrid.lastRow.map(cell => (
                                                    <SeatButton key={cell.label} label={cell.label}
                                                        booked={bookedSeats.includes(cell.label)}
                                                        chosen={selectedSeats.includes(cell.label)}
                                                        bookable={isBookable}
                                                        onToggle={toggleSeat} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* selected summary */}
                            {selectedSeats.length > 0 && (
                                <div className="mt-4 flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="text-[10px] text-gray-400 mb-0.5">Selected seats</p>
                                        <p className="text-xs font-bold font-mono text-gray-900">{selectedSeats.join(' · ')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 mb-0.5">{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}</p>
                                        {farePerSeat > 0 && (
                                            <p className="text-sm font-bold text-gray-900">ETB {(selectedSeats.length * farePerSeat).toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* booking form */}
                    {isBookable && (
                        <Card className="p-0 overflow-hidden">
                            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Booking Details</p>
                            </div>
                            <form onSubmit={handleBook} className="p-5 flex flex-col gap-5">

                                {/* passenger */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Passenger</p>
                                    <input value={passengerName} onChange={e => setPassengerName(e.target.value)}
                                        placeholder="Full name"
                                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900" />
                                    <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900">
                                        <span className="px-3 py-2.5 bg-gray-50 border-r text-sm text-gray-600 font-mono">+251</span>
                                        <input type="tel" value={phone} onChange={e => setPhone(stripLocalPhoneDigits(e.target.value))}
                                            maxLength={9} required placeholder="912345678"
                                            className="flex-1 px-3 py-2.5 text-sm outline-none font-mono" />
                                    </div>
                                </div>

                                {/* emergency contact */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                        Emergency Contact <span className="normal-case font-normal text-gray-300">(optional)</span>
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input value={emergName} onChange={e => setEmergName(e.target.value)} placeholder="Name"
                                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900" />
                                        <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900">
                                            <span className="px-3 py-2.5 bg-gray-50 border-r text-sm text-gray-600 font-mono">+251</span>
                                            <input type="tel" value={emergPhone} onChange={e => setEmergPhone(stripLocalPhoneDigits(e.target.value))}
                                                maxLength={9} placeholder="912345678"
                                                className="flex-1 px-3 py-2.5 text-sm outline-none font-mono" />
                                        </div>
                                    </div>
                                </div>

                                {/* booking status + payment method */}
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Booking Status</p>
                                        <div className="flex flex-col gap-1.5">
                                            {(['Booked', 'Pending', 'PendingPayment'] as const).map(s => (
                                                <button key={s} type="button" onClick={() => setBookingStatus(s)}
                                                    className={`py-2 rounded-xl border-2 text-xs font-semibold transition-all ${bookingStatus === s ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 text-gray-500 hover:border-gray-300'
                                                        }`}>
                                                    {s === 'PendingPayment' ? 'Pending Payment' : s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Payment Method</p>
                                        <div className="flex flex-col gap-1.5">
                                            {(['Cash', 'MobileMoney', 'BankTransfer'] as const).map(m => (
                                                <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                                                    className={`py-2 rounded-xl border-2 text-xs font-semibold transition-all ${paymentMethod === m ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 text-gray-500 hover:border-gray-300'
                                                        }`}>
                                                    {m === 'MobileMoney' ? 'Mobile Money' : m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* amounts */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Total (ETB)</p>
                                        <input type="number" min={0}
                                            value={farePerSeat > 0 ? totalAmount || '' : totalManual}
                                            readOnly={farePerSeat > 0}
                                            onChange={e => setTotalManual(e.target.value)}
                                            placeholder="0"
                                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 read-only:bg-gray-50 read-only:text-gray-500" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Amount Paid (ETB) *</p>
                                        <input type="number" min={0} value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                                            required placeholder="0"
                                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900" />
                                    </div>
                                </div>

                                {/* summary */}
                                {selectedSeats.length > 0 && totalAmount > 0 && (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div>
                                            <p className="text-[10px] text-gray-400 mb-1">Booking summary</p>
                                            <p className="text-xs font-mono text-gray-700">{selectedSeats.join(' · ')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}</p>
                                            <p className="text-lg font-bold text-gray-900">ETB {totalAmount.toLocaleString()}</p>
                                            {paid > 0 && paid < totalAmount && (
                                                <p className="text-[10px] text-orange-500 font-semibold">
                                                    Balance: ETB {(totalAmount - paid).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* submit */}
                                <button type="submit"
                                    disabled={creating || !selectedSeats.length || !phone}
                                    className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {creating ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            Creating booking…
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                                                <rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v4M10 14h4" />
                                            </svg>
                                            Confirm Booking — {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
                                            {totalAmount > 0 && ` · ETB ${totalAmount.toLocaleString()}`}
                                        </>
                                    )}
                                </button>
                            </form>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
