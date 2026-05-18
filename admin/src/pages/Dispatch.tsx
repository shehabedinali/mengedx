import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrips, updateTripStatus } from '@/store/slices/tripSlice';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function Dispatch() {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector(s => s.trips);

  useEffect(() => { dispatch(fetchTrips()); }, [dispatch]);

  const today = new Date().toDateString();
  const todayTrips = data.filter((t: any) => t.departureTime && new Date(t.departureTime).toDateString() === today);

  const updateStatus = (id: string, status: string) => dispatch(updateTripStatus({ id, status }));

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-gray-500">{todayTrips.length} trips scheduled today</p>
      {loading && <p className="text-sm text-gray-400">Loading...</p>}
      {todayTrips.length === 0 && !loading && (
        <Card><p className="text-sm text-gray-400 text-center py-4">No trips scheduled for today.</p></Card>
      )}
      {todayTrips.map((trip: any) => (
        <Card key={trip._id}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-black">
                {trip.route?.origin ?? '—'} → {trip.route?.destination ?? '—'}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                  {trip.departureTime ? new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
                  {trip.bus?.plateNumber ?? trip.bus ?? '—'}
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  {trip.driver?.name ?? trip.driver ?? '—'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={trip.status ?? 'planned'} />
              {trip.status === 'Planned' && (
                <Button size="sm" onClick={() => updateStatus(trip._id, 'Boarding')}>Start Boarding</Button>
              )}
              {trip.status === 'Boarding' && (
                <Button size="sm" onClick={() => updateStatus(trip._id, 'Departed')}>Depart</Button>
              )}
              {trip.status === 'Departed' && (
                <Button size="sm" onClick={() => updateStatus(trip._id, 'InTransit')}>In Transit</Button>
              )}
              {(trip.status === 'Planned' || trip.status === 'Boarding') && (
                <Button size="sm" variant="danger" onClick={() => updateStatus(trip._id, 'Cancelled')}>Cancel</Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
