import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrips, updateTripStatus } from '@/store/slices/tripSlice';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';

const STATUS_FLOW: Record<string, { next: string; label: string; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  Planned: [{ next: 'Boarding', label: 'Start Boarding', variant: 'primary' }, { next: 'Cancelled', label: 'Cancel', variant: 'danger' }],
  Boarding: [{ next: 'Departed', label: 'Depart', variant: 'primary' }, { next: 'Cancelled', label: 'Cancel', variant: 'danger' }],
  Departed: [{ next: 'InTransit', label: 'In Transit', variant: 'primary' }],
  InTransit: [{ next: 'Completed', label: 'Mark Completed', variant: 'primary' }],
};

const STATUS_ACCENT: Record<string, string> = {
  Planned: 'border-l-blue-400',
  Boarding: 'border-l-purple-400',
  Departed: 'border-l-indigo-400',
  InTransit: 'border-l-orange-400',
  Completed: 'border-l-green-400',
  Cancelled: 'border-l-red-400',
  Delayed: 'border-l-amber-400',
};

export default function Dispatch() {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector(s => s.trips);
  const user = useAppSelector(s => s.auth.user);
  const companyFilter = user?.role?.toLowerCase() !== 'superadmin' ? user?.company : undefined;

  useEffect(() => {
    dispatch(fetchTrips({ company: companyFilter }));
  }, [dispatch, companyFilter]);

  // trips use a `date` field (ISO date string "YYYY-MM-DD"), not departureTime
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTrips = data.filter((t: any) => {
    if (!t.date) return false;
    const tripDate = new Date(t.date).toISOString().slice(0, 10);
    return tripDate === todayKey;
  });

  const activeTrips = todayTrips.filter((t: any) => ['Planned', 'Boarding', 'Departed', 'InTransit'].includes(t.status));
  const completedToday = todayTrips.filter((t: any) => t.status === 'Completed').length;
  const cancelledToday = todayTrips.filter((t: any) => t.status === 'Cancelled').length;

  const updateStatus = (id: string, status: string) => dispatch(updateTripStatus({ id, status }));

  return (
    <div className="flex flex-col gap-5">

      {/* stat row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Trips", value: todayTrips.length, color: 'text-gray-900' },
          { label: 'Active', value: activeTrips.length, color: 'text-blue-600' },
          { label: 'Completed', value: completedToday, color: 'text-green-600' },
          { label: 'Cancelled', value: cancelledToday, color: cancelledToday > 0 ? 'text-red-600' : 'text-gray-900' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {todayTrips.length} trip{todayTrips.length !== 1 ? 's' : ''} scheduled for today
          <span className="ml-2 text-gray-400 font-normal">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </p>
        <button
          onClick={() => dispatch(fetchTrips({ company: companyFilter }))}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && todayTrips.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-200">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <p className="text-sm text-gray-400">No trips scheduled for today.</p>
            <p className="text-xs text-gray-300">Trips are matched by their date field.</p>
          </div>
        </Card>
      )}

      {!loading && todayTrips.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* active trips first */}
          {activeTrips.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Active</p>
              {activeTrips.map((trip: any) => (
                <DispatchCard key={trip._id} trip={trip} onUpdate={updateStatus} />
              ))}
            </>
          )}

          {/* completed / cancelled */}
          {(completedToday > 0 || cancelledToday > 0) && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-2">Finished</p>
              {todayTrips
                .filter((t: any) => ['Completed', 'Cancelled', 'Delayed'].includes(t.status))
                .map((trip: any) => (
                  <DispatchCard key={trip._id} trip={trip} onUpdate={updateStatus} />
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DispatchCard({ trip, onUpdate }: { trip: any; onUpdate: (id: string, status: string) => void }) {
  const actions = STATUS_FLOW[trip.status] ?? [];
  const capacity = trip.bus?.capacity ?? 0;
  const booked = trip.bookedSeats?.length ?? 0;
  const available = capacity > 0 ? capacity - booked : capacity;
  const occupancy = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;

  return (
    <Card className={`border-l-4 ${STATUS_ACCENT[trip.status] ?? 'border-l-gray-200'} p-0`}>
      <div className="p-4 flex flex-col gap-3">
        {/* header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-500">
                <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M7 18v2M17 18v2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {trip.route?.origin ?? '—'} → {trip.route?.destination ?? '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{trip.route?.name ?? '—'}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                  </svg>
                  {trip.departureTime ?? '—'}
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" />
                  </svg>
                  {trip.bus?.plateNumber ?? trip.bus ?? '—'}
                </span>
                {trip.bus?.name && (
                  <span className="text-gray-400">{trip.bus.name}</span>
                )}
                {(trip.driver?.name ?? trip.driver) && (
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    {trip.driver?.name ?? trip.driver}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge status={trip.status ?? 'planned'} />
        </div>

        {/* seat occupancy */}
        {capacity > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Seat occupancy</span>
              <span className="font-semibold text-gray-600">{booked}/{capacity} booked · {available} available</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${occupancy >= 90 ? 'bg-red-500' : occupancy >= 60 ? 'bg-orange-400' : 'bg-green-500'
                  }`}
                style={{ width: `${occupancy}%` }}
              />
            </div>
          </div>
        )}

        {/* actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            {actions.map(a => (
              <Button key={a.next} size="sm" variant={a.variant} onClick={() => onUpdate(trip._id, a.next)}>
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
