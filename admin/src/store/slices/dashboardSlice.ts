import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async (_, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState() as { auth: { user: any } };
    const role = auth.user?.role?.toLowerCase() ?? '';
    const isSuperAdmin = role === 'superadmin';
    const companyId = auth.user?.company;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Non-superadmins only see their own company's data
    const companyQuery = (!isSuperAdmin && companyId) ? { company: companyId } : {};

    const [tripsRes, busesRes, driversRes] = await Promise.all([
      client.service('trips').find({ query: { ...companyQuery, $populate: ['route', 'bus'], $limit: 200 } }),
      client.service('buses').find({ query: { ...companyQuery, $limit: 200 } }),
      client.service('drivers').find({ query: { ...companyQuery, $limit: 200 } }),
    ]);

    const trips = tripsRes.data ?? tripsRes;
    const buses = busesRes.data ?? busesRes;
    const drivers = driversRes.data ?? driversRes;

    const todayTrips = trips.filter((t: any) => t.date && t.date.slice(0, 10) === todayStr);
    const activeBuses = buses.filter((b: any) => b.status === 'Active');
    const activeDrivers = drivers.filter((d: any) => d.status === 'Active');

    // trip status breakdown
    const statusCounts = trips.reduce((acc: any, t: any) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {});

    // weekly trips (last 7 days)
    const weeklyTrips = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return trips.filter((t: any) => t.date && t.date.slice(0, 10) === key).length;
    });

    const weekLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    return {
      todayTrips: todayTrips.length,
      activeBuses: activeBuses.length,
      activeDrivers: activeDrivers.length,
      totalTrips: trips.length,
      statusCounts,
      weeklyTrips,
      weekLabels,
      recentTrips: trips.slice(0, 5),
    };
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to load dashboard');
  }
});

interface DashboardState { stats: any; loading: boolean; error: string | null; }

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { stats: null, loading: false, error: null } as DashboardState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchDashboardStats.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default dashboardSlice.reducer;
