import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrips, updateTripStatus } from '@/store/slices/tripSlice';
import { fetchBookings } from '@/store/slices/bookingSlice';
import Button from '@/components/Button';
import Card from '@/components/Card';

const TRIP_STATUSES = ['Planned', 'Boarding', 'Departed', 'InTransit', 'Completed', 'Cancelled', 'Delayed'];

const STATUS_COLORS: Record<string, string> = {
  Planned: 'bg-blue-50 text-blue-700 border-blue-200',
  Boarding: 'bg-purple-50 text-purple-700 border-purple-200',
  Departed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  InTransit: 'bg-orange-50 text-orange-700 border-orange-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
  Delayed: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_BAR: Record<string, string> = {
  Planned: 'bg-blue-400', Boarding: 'bg-purple-400', Departed: 'bg-indigo-400',
  InTransit: 'bg-orange-400', Completed: 'bg-green-400', Cancelled: 'bg-red-400', Delayed: 'bg-amber-400',
};

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—';
const fmtDur = (min: number) => { if (!min) return '—'; const h = Math.floor(min / 60); const m = min % 60; return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`; };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

// ─── Seat Grid ────────────────────────────────────────────────────────────────
// Builds the full seat label list from seatMap sections, then arranges them
// into a grid of (leftCols + rightCols) columns × rows.
// Seats fill left-to-right per row (A1 A2 A3 | A4 A5, then A6 A7 A8 | A9 A10…)
function SeatGrid({
  seatMap,
  bookedSeats,
}: {
  seatMap: any;
  bookedSeats: Set<string>;
}) {
  const layout = seatMap?.layout ?? {};
  const sections = (seatMap?.map ?? []).filter((s: any) => s.identifier?.trim() && s.numberofSeats > 0);

  const leftCols = layout.leftCols ?? 2;
  const rightCols = layout.rightCols ?? 2;
  const totalCols = leftCols + rightCols;
  const rows = layout.rows ?? 10;
  const lastRowSeats = seatMap?.numberofLastRowSeats ?? totalCols;
  const regularRows = Math.max(1, rows - 1);

  // Build flat seat label list from all sections (e.g. A1..A50)
  const allLabels: string[] = [];
  sections.forEach((s: any) => {
    for (let i = 1; i <= s.numberofSeats; i++) allLabels.push(`${s.identifier}${i}`);
  });

  // Place labels into grid[row][col] left-to-right per row
  const grid: (string | null)[][] = Array.from({ length: regularRows }, () =>
    Array(totalCols).fill(null)
  );
  let idx = 0;
  for (let row = 0; row < regularRows && idx < allLabels.length; row++) {
    for (let col = 0; col < totalCols && idx < allLabels.length; col++) {
      grid[row][col] = allLabels[idx++];
    }
  }

  // Last-row labels: continue numbering from where we left off in allLabels,
  // or fall back to L1…Ln if sections ran out
  const lastRowLabels: string[] = [];
  if (idx < allLabels.length) {
    for (let i = 0; i < lastRowSeats && idx + i < allLabels.length; i++) {
      lastRowLabels.push(allLabels[idx + i]);
    }
  } else {
    for (let i = 0; i < lastRowSeats; i++) lastRowLabels.push(`L${i + 1}`);
  }

  const cellCls = (label: string | null) => {
    if (!label) return 'bg-transparent border-transparent text-transparent';
    if (bookedSeats.has(label))
      return 'bg-red-500 border-red-600 text-white font-bold';
    return 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200';
  };

  const SeatCell = ({ label, dark }: { label: string | null; dark?: boolean }) => (
    <div
      title={label ?? undefined}
      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-mono border transition-colors select-none ${label
        ? dark
          ? 'bg-gray-800 border-gray-700 text-white font-bold'
          : cellCls(label)
        : 'bg-transparent border-transparent'
        }`}
    >
      {label ?? ''}
    </div>
  );

  const Aisle = () => (
    <div className="shrink-0 px-2 flex items-center">
      <div className="border-l-2 border-dashed border-gray-200 h-8" />
    </div>
  );

  const bookedCount = lastRowLabels.filter(l => bookedSeats.has(l)).length
    + allLabels.slice(0, idx).filter(l => bookedSeats.has(l)).length;
  const totalVisible = allLabels.length + lastRowLabels.length;

  // Derive identifier label for each column from the first row
  // e.g. grid[0] = [A1, A2, A3, B1, B2] → colHeaders = ['A','A','A','B','B']
  const colHeaders: string[] = Array.from({ length: totalCols }, (_, c) => {
    const label = grid[0]?.[c];
    if (!label) return '';
    return label.replace(/\d+$/, '');
  });

  return (
    <div className="flex flex-col gap-1 overflow-x-auto">
      {/* legend */}
      <div className="flex items-center gap-4 mb-2 text-[10px] font-semibold text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300 inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500 border border-red-600 inline-block" />
          Booked ({bookedCount})
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-gray-400">
          {totalVisible - bookedCount} of {totalVisible} free
        </span>
      </div>

      {/* column headers */}
      <div className="flex items-center">
        <span className="w-6 shrink-0" />
        <div className="flex gap-1">
          {colHeaders.slice(0, leftCols).map((id, i) => (
            <div key={i} className="w-10 flex justify-center">
              <span className="text-[10px] font-bold text-gray-400">{id || `C${i + 1}`}</span>
            </div>
          ))}
        </div>
        <Aisle />
        <div className="flex gap-1">
          {colHeaders.slice(leftCols).map((id, i) => (
            <div key={i} className="w-10 flex justify-center">
              <span className="text-[10px] font-bold text-gray-400">{id || `C${leftCols + i + 1}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* regular rows */}
      {grid.map((row, ri) => (
        <div key={ri} className="flex items-center gap-1">
          <span className="w-6 shrink-0 text-right text-[9px] font-mono text-gray-300">{ri + 1}</span>
          <div className="flex gap-1">
            {row.slice(0, leftCols).map((seat, ci) => (
              <SeatCell key={`l-${ri}-${ci}`} label={seat} />
            ))}
          </div>
          <Aisle />
          <div className="flex gap-1">
            {row.slice(leftCols).map((seat, ci) => (
              <SeatCell key={`r-${ri}-${ci}`} label={seat} />
            ))}
          </div>
        </div>
      ))}

      {/* last row — full width, no aisle */}
      <div className="flex items-center gap-1 border-t border-dashed border-gray-200 pt-1.5 mt-0.5">
        <span className="w-6 shrink-0 text-right text-[9px] font-mono font-bold text-gray-400">{rows}</span>
        <div className="flex flex-wrap gap-1">
          {lastRowLabels.map((label, i) => (
            <SeatCell key={`last-${i}`} label={label} dark={!bookedSeats.has(label)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector(s => s.trips);
  const { data: bookings, loading: bookingsLoading } = useAppSelector(s => s.bookings);

  useEffect(() => { if (!data.length) dispatch(fetchTrips(undefined)); }, [dispatch, data.length]);
  useEffect(() => { if (id) dispatch(fetchBookings(undefined)); }, [dispatch, id]);

  const trip = data.find((t: any) => t._id === id);
  const route = trip?.route;
  const bus = trip?.bus;
  const capacity = bus?.capacity ?? 0;
  const booked = trip?.bookedSeats?.length ?? 0;
  const available = capacity > 0 ? capacity - booked : capacity;
  const occupancy = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;

  // Collect all booked seat labels for this trip (excluding cancelled bookings)
  const bookedSeats = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    bookings
      .filter((b: any) => {
        const tripId = typeof b.trip === 'string' ? b.trip : b.trip?._id;
        return tripId === id && b.status !== 'Cancelled';
      })
      .forEach((b: any) => {
        (b.seats ?? []).forEach((s: string) => set.add(s));
      });
    return set;
  }, [bookings, id]);

  if (loading && !trip) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl">
        <div className="h-7 w-40 skeleton rounded-lg" />
        <div className="h-48 skeleton rounded-2xl" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-gray-400 text-sm">Trip not found.</p>
        <Button variant="secondary" onClick={() => navigate('/trips')}>← Back to Trips</Button>
      </div>
    );
  }

  const sortedStops = (route?.stops ?? []).slice().sort((a: any, b: any) => a.order - b.order);

  return (
    <div className="flex flex-col gap-5 max-w-2xl animate-fade-in">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/trips')} className="text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
          Trips
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{route?.origin ?? '—'} → {route?.destination ?? '—'}</span>
      </div>

      {/* hero card */}
      <Card className="p-0 overflow-hidden">
        <div className={`h-1.5 w-full ${STATUS_BAR[trip.status] ?? 'bg-gray-300'}`} />
        <div className="p-5 flex flex-col gap-4">

          {/* route + status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-gray-500">
                  <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{route?.origin ?? '—'} → {route?.destination ?? '—'}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{route?.name ?? '—'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {trip.status}
                  </span>
                  {route?.distance && <span className="text-xs text-gray-400">{route.distance} km · {fmtDur(route.duration)}</span>}
                </div>
              </div>
            </div>
            {/* status updater */}
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white hover:border-gray-400 transition-colors font-medium shrink-0"
              value={trip.status}
              onChange={e => dispatch(updateTripStatus({ id: trip._id, status: e.target.value }))}
            >
              {TRIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* date + time */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400 shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <div>
              <p className="text-sm font-bold text-gray-900">{fmt(trip.date)}</p>
              <p className="text-xs text-gray-400">Departure at {trip.departureTime ?? '—'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Seats', value: capacity },
          { label: 'Available', value: available, color: available > 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Booked', value: booked, color: booked > 0 ? 'text-orange-500' : 'text-gray-900' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color ?? 'text-gray-900'}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* occupancy bar */}
      {capacity > 0 && (
        <Card>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Seat Occupancy</p>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{booked} booked</span>
            <span className="font-semibold text-gray-700">{occupancy}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${occupancy >= 90 ? 'bg-red-500' : occupancy >= 60 ? 'bg-orange-400' : 'bg-green-500'
              }`} style={{ width: `${occupancy}%` }} />
          </div>
        </Card>
      )}

      {/* seat map grid */}
      {bus?.seatMap && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Seat Map</p>
            {bookingsLoading && (
              <span className="text-[10px] text-gray-400 animate-pulse">Loading bookings…</span>
            )}
          </div>
          <SeatGrid seatMap={bus.seatMap} bookedSeats={bookedSeats} />
        </Card>
      )}

      {/* bus details */}
      {bus && (
        <Card>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Bus</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-500">
                <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M7 18v2M17 18v2" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{bus.name}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{bus.plateNumber} · {capacity} seats</p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${bus.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>{bus.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 mt-4 pt-4 border-t border-gray-100">
            <Field label="Insurance Expiry">
              {bus.insuranceExpiry ? new Date(bus.insuranceExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </Field>
            <Field label="Registration Expiry">
              {bus.registrationExpiry ? new Date(bus.registrationExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </Field>
            <Field label="Last Maintenance">
              {bus.lastMaintenanceDate ? new Date(bus.lastMaintenanceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </Field>
          </div>
        </Card>
      )}

      {/* route timeline */}
      {route && (
        <Card>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Route Timeline</p>
          <div className="flex flex-col">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-4 h-4 rounded-full bg-green-500 ring-2 ring-green-200 mt-0.5" />
                {sortedStops.length > 0 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[2rem]" />}
              </div>
              <div className="pb-4 flex-1">
                <p className="text-sm font-bold text-gray-900">{route.origin}</p>
                <p className="text-xs text-gray-400">Origin · 0 ETB</p>
              </div>
            </div>
            {sortedStops.map((stop: any, i: number) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-400 mt-0.5" />
                  <div className="w-px flex-1 bg-gray-200 my-1 min-h-[2rem]" />
                </div>
                <div className="pb-4 flex-1 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{stop.name}</p>
                    <p className="text-xs text-gray-400">Stop {stop.order}</p>
                  </div>
                  <span className="text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full">
                    {stop.fareFromOrigin} ETB
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-4 h-4 rounded-full bg-red-500 ring-2 ring-red-200 mt-0.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{route.destination}</p>
                <p className="text-xs text-gray-400">Destination</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* trip meta */}
      <Card>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Trip Details</p>
        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
          <Field label="Created By Role">{trip.createdByRole ?? '—'}</Field>
          <Field label="Distance">{route?.distance ? `${route.distance} km` : '—'}</Field>
          <Field label="Duration">{fmtDur(route?.duration)}</Field>
          <Field label="Total Stops">{sortedStops.length}</Field>
        </div>
      </Card>
    </div>
  );
}
