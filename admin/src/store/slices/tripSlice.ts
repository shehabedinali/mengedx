import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchTrips = createAsyncThunk('trips/fetch', async (params: { company?: string } | undefined = {}, { rejectWithValue }) => {
  try {
    const query: Record<string, any> = { $populate: ['bus', 'route'] };
    if (params.company) query.company = params.company;
    const res = await client.service('trips').find({ query });
    return res.data ?? res;
  }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to fetch trips'); }
});

export const createTrip = createAsyncThunk('trips/create', async (data: any, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState() as { auth: { user: any } };
    const user = auth.user;
    
    // For super admins, use the selected company ID; for others, use their own company
    if (!data.company) {
      data.company = user?.role?.toLowerCase() === 'superadmin' ? null : user?.company;
    }
    
    // Validate company is provided
    if (!data.company) {
      return rejectWithValue('Company is required');
    }
    
    data.createdBy = user?._id;
    data.createdByRole = user?.role;
    const res = await client.service('trips').create(data);
    await client.service('buses').patch(res.bus, { status: 'Assigned' });
    return res;
  } catch (err: any) { 
    return rejectWithValue(err.message || 'Failed to create trip'); 
  }
});

export const updateTripStatus = createAsyncThunk('trips/updateStatus', async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
  try { const res = await client.service('trips').patch(id, { status }); return res; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to update trip'); }
});

interface TripState { data: any[]; loading: boolean; error: string | null; blockedDates: string[]; }

const tripSlice = createSlice({
  name: 'trips',
  initialState: { data: [], loading: false, error: null, blockedDates: [] } as TripState,
  reducers: {
    toggleBlockedDate(state, action: { payload: string }) {
      const idx = state.blockedDates.indexOf(action.payload);
      if (idx === -1) state.blockedDates.push(action.payload);
      else state.blockedDates.splice(idx, 1);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTrips.fulfilled, (state, action) => { state.loading = false; state.data = action.payload.data ?? action.payload; })
      .addCase(fetchTrips.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createTrip.fulfilled, (state, action) => { state.data.unshift(action.payload); })
      .addCase(updateTripStatus.fulfilled, (state, action) => { const i = state.data.findIndex(t => t._id === action.payload._id); if (i !== -1) state.data[i] = action.payload; });
  },
});

export const { toggleBlockedDate } = tripSlice.actions;
export default tripSlice.reducer;
